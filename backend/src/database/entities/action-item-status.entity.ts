import { Entity, Column, Index, Unique } from 'typeorm'
import { BaseEntity } from './base.entity'

@Entity('action_item_statuses')
@Unique(['meeting_id', 'item_index'])
export class ActionItemStatus extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  workspace_id: string

  @Column({ type: 'uuid' })
  meeting_id: string

  @Column({ type: 'integer' })
  item_index: number

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: 'open' | 'done'
}
