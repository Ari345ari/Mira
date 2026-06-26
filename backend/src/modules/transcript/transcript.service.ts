import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Transcript } from '../../database/entities/transcript.entity'

@Injectable()
export class TranscriptService {
  constructor(
    @InjectRepository(Transcript)
    private readonly repo: Repository<Transcript>,
  ) {}

  async save(data: Partial<Transcript>): Promise<Transcript> {
    const existing = await this.repo.findOne({ where: { meeting_id: data.meeting_id } })
    if (existing) {
      Object.assign(existing, data)
      return this.repo.save(existing)
    }
    return this.repo.save(this.repo.create(data))
  }

  async getByMeetingId(meetingId: string): Promise<Transcript | null> {
    return this.repo.findOne({ where: { meeting_id: meetingId } })
  }

  async getOrThrow(meetingId: string): Promise<Transcript> {
    const t = await this.getByMeetingId(meetingId)
    if (!t) throw new NotFoundException('Transcript not found')
    return t
  }
}
