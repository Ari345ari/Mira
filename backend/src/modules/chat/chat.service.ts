import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Protocol } from '../../database/entities/protocol.entity'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { Meeting } from '../../database/entities/meeting.entity'

export interface ChatMessage { role: 'user' | 'model'; text: string }

const TOP_K = 20  // max meetings sent to AI

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI | null = null

  constructor(
    @InjectRepository(Protocol)
    private protocolRepo: Repository<Protocol>,
    @InjectRepository(WorkspaceMember)
    private memberRepo: Repository<WorkspaceMember>,
    @InjectRepository(Meeting)
    private meetingRepo: Repository<Meeting>,
  ) {}

  private getClient() {
    if (!this.genAI) this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    return this.genAI
  }

  // Score a meeting's relevance to a query using keyword overlap
  private score(query: string, protocol: Protocol & { meeting?: any }): number {
    const terms = query.toLowerCase().split(/\W+/).filter(w => w.length > 2)
    const haystack = [
      protocol.meeting?.title ?? '',
      protocol.summary ?? '',
      ...(protocol.key_decisions as string[] ?? []),
      ...(protocol.action_items as any[] ?? []).map((a: any) => a.task ?? ''),
      ...(protocol.open_questions as string[] ?? []),
    ].join(' ').toLowerCase()
    return terms.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0)
  }

  private formatProtocol(p: Protocol & { meeting?: any }, idx: number): string {
    const m = p.meeting as any
    const date = m?.meeting_date ? new Date(m.meeting_date).toLocaleDateString() : 'Unknown'
    const title = m?.title ?? 'Untitled'
    const decisions = (p.key_decisions as string[])?.join('; ') || 'None'
    const actions = (p.action_items as any[])?.map((a: any) => a.task).join('; ') || 'None'
    const questions = (p.open_questions as string[])?.join('; ') || 'None'
    return `[Meeting ${idx + 1}] "${title}" — ${date}\nSummary: ${p.summary ?? 'N/A'}\nDecisions: ${decisions}\nAction items: ${actions}\nOpen questions: ${questions}`
  }

  async brief(userId: string, agenda: string, workspaceId?: string): Promise<string> {
    const memberships = await this.memberRepo.find({ where: { user_id: userId } })
    const wsIds = workspaceId
      ? [workspaceId]
      : memberships.map(m => m.workspace_id)

    let context = ''
    if (wsIds.length > 0) {
      const all = await this.protocolRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.meeting', 'm')
        .where('p.workspace_id IN (:...wsIds)', { wsIds })
        .andWhere('m.deleted_at IS NULL')
        .orderBy('m.meeting_date', 'DESC')
        .getMany()

      if (all.length > 0) {
        const scored = all
          .map(p => ({ p, s: this.score(agenda, p as any) }))
          .sort((a, b) => b.s - a.s)
          .slice(0, TOP_K)
          .map(({ p }) => p)
        context = scored.map((p, i) => this.formatProtocol(p as any, i)).join('\n\n')
      }
    }

    const prompt = context
      ? `You are a meeting intelligence assistant. A user is about to have a meeting and has shared their agenda. Based on the relevant past meeting notes below, generate a concise pre-meeting brief with these sections:\n\n1. **Relevant Past Decisions** — decisions from past meetings that relate to this agenda\n2. **Open Action Items** — unresolved tasks from past meetings on related topics\n3. **Key Context** — important background a participant needs to know\n4. **Suggested Prep** — 2-3 concrete things the user should prepare or check before this meeting\n\nKeep it tight and actionable. Use bullet points.\n\nUPCOMING MEETING AGENDA:\n${agenda}\n\nRELEVANT PAST MEETING NOTES:\n${context}`
      : `You are a meeting intelligence assistant. The user has no past meeting notes yet. Based on their agenda, give general preparation tips.\n\nAGENDA:\n${agenda}`

    const model = this.getClient().getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  }

  async chat(
    userId: string,
    message: string,
    history: ChatMessage[],
    projectId?: string,
  ): Promise<string> {
    const memberships = await this.memberRepo.find({ where: { user_id: userId } })
    const wsIds = memberships.map(m => m.workspace_id)

    let context = ''
    if (wsIds.length > 0) {
      // Fetch ALL protocols (for project: all in folder; otherwise: workspace-wide)
      const qb = this.protocolRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.meeting', 'm')
        .where('p.workspace_id IN (:...wsIds)', { wsIds })
        .andWhere('m.deleted_at IS NULL')

      if (projectId) {
        qb.andWhere('m.folder_id = :projectId', { projectId })
      }

      const all = await qb.orderBy('m.meeting_date', 'DESC').getMany()

      if (all.length > 0) {
        // Rank by relevance to the current message; fall back to recency
        const scored = all
          .map(p => ({ p, s: this.score(message, p as any) }))
          .sort((a, b) => b.s - a.s || 0)
          .slice(0, TOP_K)
          .map(({ p }) => p)

        context = scored.map((p, i) => this.formatProtocol(p as any, i)).join('\n\n')
      }
    }

    const scope = projectId ? 'this project folder' : 'the user\'s meetings'
    const systemPrompt = context
      ? `You are an AI assistant for a meeting notes app. You have access to the most relevant meeting notes from ${scope} (selected from potentially hundreds of meetings by relevance to the question). Answer concisely and helpfully. If asked about a specific meeting or date, refer to the notes below.\n\nRELEVANT MEETING NOTES:\n${context}\n\nUser question:`
      : `You are an AI assistant for a meeting notes app. No meeting notes are available yet — guide the user to upload or record a meeting. User question:`

    const model = this.getClient().getGenerativeModel({ model: 'gemini-2.5-flash' })
    const chat = model.startChat({
      history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    })

    const result = await chat.sendMessage(`${systemPrompt} ${message}`)
    return result.response.text().trim()
  }
}
