import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Protocol } from '../../database/entities/protocol.entity'
import { ActionItemStatus } from '../../database/entities/action-item-status.entity'

@Injectable()
export class ActionsService {
  constructor(
    @InjectRepository(Protocol)
    private protocolRepo: Repository<Protocol>,
    @InjectRepository(ActionItemStatus)
    private statusRepo: Repository<ActionItemStatus>,
  ) {}

  async getAll(workspaceId: string) {
    const protocols = await this.protocolRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.meeting', 'm')
      .where('p.workspace_id = :workspaceId', { workspaceId })
      .andWhere('m.deleted_at IS NULL')
      .orderBy('m.meeting_date', 'DESC')
      .getMany()

    const statuses = await this.statusRepo.find({ where: { workspace_id: workspaceId } })
    const statusMap = new Map(statuses.map(s => [`${s.meeting_id}:${s.item_index}`, s.status]))

    const items: any[] = []
    for (const p of protocols) {
      const m = p.meeting as any
      const actionItems = (p.action_items as any[]) ?? []
      actionItems.forEach((a: any, idx: number) => {
        items.push({
          meeting_id:    m.id,
          meeting_title: m.title,
          meeting_date:  m.meeting_date,
          item_index:    idx,
          task:     a.task ?? '',
          owner:    a.owner ?? null,
          due_date: a.due_date ?? null,
          priority: a.priority ?? 'medium',
          status:   statusMap.get(`${m.id}:${idx}`) ?? 'open',
        })
      })
    }
    return items
  }

  async updateStatus(workspaceId: string, meetingId: string, itemIndex: number, status: 'open' | 'done') {
    await this.statusRepo.upsert(
      { workspace_id: workspaceId, meeting_id: meetingId, item_index: itemIndex, status },
      ['meeting_id', 'item_index'],
    )
    return { ok: true }
  }
}
