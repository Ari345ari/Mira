import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MeetingTemplate } from '../../database/entities/meeting-template.entity'

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(MeetingTemplate)
    private repo: Repository<MeetingTemplate>,
  ) {}

  findAll(workspaceId: string) {
    return this.repo.find({
      where: { workspace_id: workspaceId },
      order: { created_at: 'ASC' },
    })
  }

  async create(workspaceId: string, body: Partial<MeetingTemplate>) {
    const tpl = this.repo.create({ ...body, workspace_id: workspaceId })
    return this.repo.save(tpl)
  }

  async update(workspaceId: string, id: string, body: Partial<MeetingTemplate>) {
    const tpl = await this.repo.findOne({ where: { id, workspace_id: workspaceId } })
    if (!tpl) throw new NotFoundException()
    Object.assign(tpl, body)
    return this.repo.save(tpl)
  }

  async remove(workspaceId: string, id: string) {
    const tpl = await this.repo.findOne({ where: { id, workspace_id: workspaceId } })
    if (!tpl) throw new NotFoundException()
    await this.repo.softDelete(id)
    return { ok: true }
  }
}
