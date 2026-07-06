import { Injectable, Logger } from '@nestjs/common'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface Protocol {
  summary: string
  agenda_items: { title: string; duration_min: number }[]
  key_decisions: string[]
  action_items: { task: string; owner: string; due_date: string | null; priority: string }[]
  open_questions: string[]
  next_meeting: { proposed_date: string | null; topics: string[] } | null
}

@Injectable()
export class RealAiService {
  private readonly logger = new Logger(RealAiService.name)
  private genAI: GoogleGenerativeAI | null = null

  private getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    }
    return this.genAI
  }

  async generate(
    _transcriptId: string,
    title: string,
    language: string,
    fullText: string,
  ): Promise<{ protocol: Protocol; raw: object; generation_ms: number }> {
    this.logger.log(`Generating protocol for "${title}" via Gemini Flash`)
    const start = Date.now()

    try {
      const model = this.getClient().getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      })

      const prompt = `You are analyzing a meeting titled "${title}" (language: ${language}).
Extract a structured meeting protocol from the transcript below and return a JSON object.

Transcript:
---
${fullText.slice(0, 15000)}
---

Return ONLY this JSON structure (no markdown, no explanation):
{
  "summary": "2-4 sentence summary of what was discussed and decided",
  "agenda_items": [{"title": "string", "duration_min": number}],
  "key_decisions": ["string"],
  "action_items": [{"task": "string", "owner": "string or Unknown", "due_date": "YYYY-MM-DD or null", "priority": "high|medium|low"}],
  "open_questions": ["string"],
  "next_meeting": {"proposed_date": "YYYY-MM-DD or null", "topics": ["string"]}
}

Rules:
- key_decisions: only explicit agreements or decisions made
- action_items: concrete tasks assigned to someone
- open_questions: questions raised but not resolved
- All arrays may be []`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const protocol = JSON.parse(text) as Protocol
      return { protocol, raw: { model: 'gemini-2.0-flash', text }, generation_ms: Date.now() - start }

    } catch (err) {
      this.logger.warn(`Gemini failed (${(err as Error).message}), extracting from transcript text`)
      const protocol = this.extractFromText(title, fullText)
      return { protocol, raw: { fallback: true, error: (err as Error).message }, generation_ms: Date.now() - start }
    }
  }

  async grammarCheck(text: string): Promise<string> {
    try {
      const model = this.getClient().getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent(
        `Fix grammar, spelling, and punctuation. Return ONLY the corrected text with no explanation:\n\n${text}`,
      )
      return result.response.text().trim() || text
    } catch {
      return text
    }
  }

  private extractFromText(title: string, text: string): Protocol {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const cleanLines = lines.map(l => l.replace(/^\[[^\]]+\]:\s*/, ''))
    const fullClean = cleanLines.join(' ')

    const sentences = fullClean.match(/[^.!?]{20,}[.!?]/g) ?? []
    const summary = sentences.slice(0, 3).join(' ').trim() || `Meeting: ${title}`

    const questions = cleanLines.filter(l => l.endsWith('?') && l.length > 15).slice(0, 5)

    const actionPatterns = /\b(will|should|need to|going to|must|have to|let's|lets)\b/i
    const action_items = cleanLines
      .filter(l => actionPatterns.test(l) && l.length > 20)
      .slice(0, 5)
      .map(l => ({
        task: l.length > 120 ? l.slice(0, 120) + '…' : l,
        owner: 'TBD',
        due_date: null as string | null,
        priority: 'medium' as const,
      }))

    const decisionPatterns = /\b(decided|agreed|approved|confirmed|resolved|concluded)\b/i
    const key_decisions = cleanLines
      .filter(l => decisionPatterns.test(l) && l.length > 15)
      .slice(0, 4)

    return { summary, agenda_items: [], key_decisions, action_items, open_questions: questions, next_meeting: null }
  }
}
