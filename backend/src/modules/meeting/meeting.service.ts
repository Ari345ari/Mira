import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectQueue } from '@nestjs/bull'
import type { Queue } from 'bull'
import { Repository } from 'typeorm'
import * as path from 'path'
import * as fs from 'fs'
import { Meeting, MeetingStatus, MeetingLanguage } from '../../database/entities/meeting.entity'
import { WorkspaceMember } from '../../database/entities/workspace-member.entity'
import { CreateMeetingDto } from './meeting.dto'

const ALLOWED_AUDIO = ['.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.webm', '.flac', '.opus']

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,
    @InjectQueue('meeting-processing')
    private readonly queue: Queue,
  ) {}

  async create(
    userId: string,
    dto: CreateMeetingDto,
    file: Express.Multer.File,
  ): Promise<Meeting> {
    await this.assertMember(dto.workspace_id, userId)

    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_AUDIO.includes(ext)) {
      fs.unlinkSync(file.path)
      throw new BadRequestException(`Unsupported file type: ${ext}`)
    }

    // FormData sends participants as a single comma-separated string or array
    let participants: string[] = []
    if (dto.participants) {
      const raw = dto.participants as unknown
      if (typeof raw === 'string') {
        participants = raw.split(',').map((p) => p.trim()).filter(Boolean)
      } else if (Array.isArray(raw)) {
        participants = raw.map((p) => String(p).trim()).filter(Boolean)
      }
    }

    const meeting = this.meetingRepo.create({
      workspace_id: dto.workspace_id,
      created_by: userId,
      title: dto.title,
      meeting_date: new Date(dto.meeting_date),
      language: dto.language ?? MeetingLanguage.MN,
      participants,
      status: MeetingStatus.QUEUED,
      upload_completed_at: new Date(),
      file_path: file.path,
    })

    const saved = await this.meetingRepo.save(meeting)

    // Enqueue processing job
    await this.queue.add('process-meeting', {
      meetingId: saved.id,
      filePath: file.path,
      language: saved.language,
    }, { attempts: 2, backoff: 5000 })

    return saved
  }

  async list(userId: string, workspaceId?: string): Promise<Meeting[]> {
    if (workspaceId) {
      await this.assertMember(workspaceId, userId)
      return this.meetingRepo.find({
        where: { workspace_id: workspaceId },
        order: { created_at: 'DESC' },
      })
    }

    // Get all workspaces user belongs to
    const memberships = await this.memberRepo.find({ where: { user_id: userId } })
    if (!memberships.length) return []
    const wsIds = memberships.map((m) => m.workspace_id)

    return this.meetingRepo
      .createQueryBuilder('m')
      .where('m.workspace_id IN (:...wsIds)', { wsIds })
      .orderBy('m.created_at', 'DESC')
      .getMany()
  }

  async getById(id: string, userId: string): Promise<Meeting> {
    const meeting = await this.meetingRepo.findOne({ where: { id } })
    if (!meeting) throw new NotFoundException('Meeting not found')
    await this.assertMember(meeting.workspace_id, userId)
    return meeting
  }

  async updateStatus(
    id: string,
    status: MeetingStatus,
    extra?: Partial<Meeting>,
  ): Promise<void> {
    await this.meetingRepo.update(id, { status, ...extra })
  }

  async getByIdInternal(id: string): Promise<Meeting | null> {
    return this.meetingRepo.findOne({ where: { id } })
  }

  async delete(id: string, userId: string): Promise<void> {
    const meeting = await this.getById(id, userId)
    await this.meetingRepo.softDelete(meeting.id)
  }

  private async assertMember(workspaceId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { workspace_id: workspaceId, user_id: userId },
    })
    if (!member) throw new ForbiddenException('Not a workspace member')
  }
}
