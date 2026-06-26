import { Entity, Column, JoinColumn, OneToOne, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Meeting } from './meeting.entity'

@Entity('protocols')
export class Protocol extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  meeting_id: string

  @Index()
  @Column({ type: 'uuid' })
  workspace_id: string

  @Column({ type: 'text', nullable: true })
  summary: string | null

  @Column({ type: 'varchar', length: 10, default: 'mn' })
  language: string

  @Column({ type: 'jsonb', default: '[]' })
  agenda_items: object[]

  @Column({ type: 'jsonb', default: '[]' })
  key_decisions: string[]

  @Column({ type: 'jsonb', default: '[]' })
  action_items: object[]

  @Column({ type: 'jsonb', default: '[]' })
  open_questions: string[]

  @Column({ type: 'jsonb', nullable: true })
  next_meeting: object | null

  @Column({ type: 'jsonb', nullable: true })
  raw_ai_response: object | null

  @Column({ type: 'text', default: 'gpt-4o-mini' })
  ai_model: string

  @Column({ type: 'text', default: 'v1.0' })
  prompt_version: string

  @Column({ type: 'integer', nullable: true })
  generation_ms: number | null

  @Column({ type: 'boolean', default: false })
  is_edited: boolean

  @Column({ type: 'uuid', nullable: true })
  last_edited_by: string | null

  @Column({ type: 'timestamptz', nullable: true })
  last_edited_at: Date | null

  @OneToOne(() => Meeting)
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting
}
