import { Injectable, Logger } from '@nestjs/common'
import { AssemblyAI } from 'assemblyai'
import * as fs from 'fs'
import { MeetingLanguage } from '../database/entities/meeting.entity'

interface SpeakerTurn {
  speaker: string
  start: number
  end: number
  text: string
}

@Injectable()
export class RealSttService {
  private readonly logger = new Logger(RealSttService.name)
  private client: AssemblyAI | null = null

  private getClient(): AssemblyAI {
    if (!this.client) {
      this.client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! })
    }
    return this.client
  }

  async transcribe(
    filePath: string,
    language: MeetingLanguage,
    participants: string[],
  ): Promise<{ full_text: string; speaker_turns: SpeakerTurn[]; speaker_count: number; raw: object; transcriptId: string }> {
    this.logger.log(`Transcribing "${filePath}" with AssemblyAI`)

    const params: Record<string, any> = {
      audio: fs.createReadStream(filePath),
      speaker_labels: true,
    }

    // AssemblyAI has best accuracy for English; Mongolian falls back to auto-detect
    if (language === MeetingLanguage.EN) {
      params.language_code = 'en'
    }

    const transcript = await this.getClient().transcripts.transcribe(params as any)

    if (transcript.status === 'error') {
      throw new Error(`AssemblyAI error: ${transcript.error}`)
    }

    const utterances = transcript.utterances ?? []
    const speakerMap = new Map<string, string>()

    const turns: SpeakerTurn[] = utterances.map((u) => {
      if (!speakerMap.has(u.speaker)) {
        const idx = speakerMap.size
        speakerMap.set(u.speaker, participants[idx] ?? `Speaker ${idx + 1}`)
      }
      return {
        speaker: speakerMap.get(u.speaker)!,
        start: Math.round(u.start / 100) / 10, // ms → seconds (1 decimal)
        end: Math.round(u.end / 100) / 10,
        text: u.text,
      }
    })

    const full_text = turns.length
      ? turns.map((t) => `[${t.speaker}]: ${t.text}`).join('\n')
      : (transcript.text ?? '')

    return {
      full_text,
      speaker_turns: turns,
      speaker_count: Math.max(1, speakerMap.size),
      raw: transcript as unknown as object,
      transcriptId: transcript.id,
    }
  }
}
