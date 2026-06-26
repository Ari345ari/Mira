import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Protocol } from '../../database/entities/protocol.entity'
import { UpdateProtocolDto } from './protocol.dto'

@Injectable()
export class ProtocolService {
  constructor(
    @InjectRepository(Protocol)
    private readonly repo: Repository<Protocol>,
  ) {}

  async save(data: Partial<Protocol>): Promise<Protocol> {
    const existing = await this.repo.findOne({ where: { meeting_id: data.meeting_id } })
    if (existing) {
      Object.assign(existing, data)
      return this.repo.save(existing)
    }
    return this.repo.save(this.repo.create(data))
  }

  async getByMeetingId(meetingId: string): Promise<Protocol | null> {
    return this.repo.findOne({ where: { meeting_id: meetingId } })
  }

  async getOrThrow(meetingId: string): Promise<Protocol> {
    const p = await this.getByMeetingId(meetingId)
    if (!p) throw new NotFoundException('Protocol not found')
    return p
  }

  async update(meetingId: string, userId: string, dto: UpdateProtocolDto): Promise<Protocol> {
    const p = await this.getOrThrow(meetingId)
    Object.assign(p, dto, {
      is_edited: true,
      last_edited_by: userId,
      last_edited_at: new Date(),
    })
    return this.repo.save(p)
  }
}
