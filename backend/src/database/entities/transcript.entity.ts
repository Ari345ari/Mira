import { Entity, Column, JoinColumn, OneToOne, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Meeting } from './meeting.entity'

@Entity('transcripts')
export class Transcript extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  meeting_id: string

  @Index()
  @Column({ type: 'uuid' })
  workspace_id: string

  @Column({ type: 'text' })
  full_text: string

  @Column({ type: 'jsonb', default: '[]' })
  words: object[]

  @Column({ type: 'jsonb', default: '[]' })
  speaker_turns: object[]

  @Column({ type: 'integer', default: 1 })
  speaker_count: number

  @Column({ type: 'jsonb', nullable: true })
  raw_stt_response: object | null

  @OneToOne(() => Meeting)
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting
}
