import { Processor, Process } from '@nestjs/bull'
import type { Job } from 'bull'
import { Logger } from '@nestjs/common'
import { MeetingService } from '../modules/meeting/meeting.service'
import { TranscriptService } from '../modules/transcript/transcript.service'
import { ProtocolService } from '../modules/protocol/protocol.service'
import { MockSttService } from '../services/mock-stt.service'
import { MockAiService } from '../services/mock-ai.service'
import { RealSttService } from '../services/real-stt.service'
import { RealAiService } from '../services/real-ai.service'
import { MeetingStatus, MeetingLanguage } from '../database/entities/meeting.entity'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface JobData {
  meetingId: string
  filePath: string
  language: MeetingLanguage
}

@Processor('meeting-processing')
export class ProcessingWorker {
  private readonly logger = new Logger(ProcessingWorker.name)

  constructor(
    private readonly meetingService: MeetingService,
    private readonly transcriptService: TranscriptService,
    private readonly protocolService: ProtocolService,
    private readonly mockStt: MockSttService,
    private readonly mockAi: MockAiService,
    private readonly realStt: RealSttService,
    private readonly realAi: RealAiService,
  ) {}

  @Process('process-meeting')
  async handle(job: Job<JobData>): Promise<void> {
    const { meetingId, filePath, language } = job.data
    const useMockStt = process.env.USE_MOCK_STT !== 'false'
    const useMockAi  = process.env.USE_MOCK_AI  !== 'false'
    this.logger.log(`Processing ${meetingId} [stt=${useMockStt ? 'mock' : 'real'}, ai=${useMockAi ? 'mock' : 'real'}]`)

    try {
      await this.meetingService.updateStatus(meetingId, MeetingStatus.TRANSCRIBING)
      await job.progress(20)

      const meeting = await this.meetingService.getByIdInternal(meetingId).catch(() => null)
      const participants = meeting?.participants ?? []

      let full_text: string
      let speaker_turns: object[]
      let speaker_count: number
      let raw_stt_response: object
      let sttTranscriptId: string | null = null

      if (useMockStt) {
        await sleep(1500)
        const result = this.mockStt.transcribe(language, participants)
        full_text = result.full_text
        speaker_turns = result.speaker_turns
        speaker_count = result.speaker_count
        raw_stt_response = { mock: true }
      } else {
        const result = await this.realStt.transcribe(filePath, language, participants)
        full_text = result.full_text
        speaker_turns = result.speaker_turns
        speaker_count = result.speaker_count
        raw_stt_response = result.raw
        sttTranscriptId = result.transcriptId
      }

      await this.transcriptService.save({
        meeting_id: meetingId,
        workspace_id: meeting?.workspace_id,
        full_text,
        speaker_turns: speaker_turns as any,
        speaker_count,
        words: [] as any,
        raw_stt_response: raw_stt_response as any,
      })

      await job.progress(55)
      await this.meetingService.updateStatus(meetingId, MeetingStatus.ANALYZING)
      if (useMockStt) await sleep(1200)

      await this.meetingService.updateStatus(meetingId, MeetingStatus.GENERATING_PROTOCOL)
      await job.progress(75)

      const title = meeting?.title ?? 'Meeting'
      let protocolData: any
      let raw_ai_response: object
      let generation_ms: number
      let ai_model: string

      if (useMockAi || !sttTranscriptId) {
        await sleep(1000)
        protocolData = this.mockAi.generate(title, speaker_count)
        raw_ai_response = { mock: true }
        generation_ms = 1000
        ai_model = 'mock-v1'
      } else {
        const result = await this.realAi.generate(sttTranscriptId, title, language, full_text)
        protocolData = result.protocol
        raw_ai_response = result.raw
        generation_ms = result.generation_ms
        ai_model = 'lemur-default'
      }

      const lastTurn = speaker_turns[speaker_turns.length - 1] as any
      const durationSeconds = Math.round(lastTurn?.end ?? 600)

      await this.protocolService.save({
        meeting_id: meetingId,
        workspace_id: meeting?.workspace_id,
        ...protocolData,
        language: language as any,
        ai_model,
        prompt_version: '1.0',
        generation_ms,
        is_edited: false,
        raw_ai_response: raw_ai_response as any,
      })

      await this.meetingService.updateStatus(meetingId, MeetingStatus.DONE, {
        duration_seconds: durationSeconds,
        processing_completed_at: new Date(),
      } as any)

      await job.progress(100)
      this.logger.log(`Meeting ${meetingId} processed successfully`)
    } catch (err) {
      this.logger.error(`Failed to process meeting ${meetingId}`, err)
      await this.meetingService.updateStatus(meetingId, MeetingStatus.FAILED, {
        error_message: (err as Error).message,
      } as any)
      throw err
    }
  }
}
