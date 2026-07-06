import {
  Entity, Column, ManyToOne, OneToOne,
  OneToMany, JoinColumn, Index,
} from 'typeorm'
import { BaseEntity } from './base.entity'
import { Workspace } from './workspace.entity'
import { User } from './user.entity'

export enum MeetingStatus {
  PENDING             = 'pending',
  UPLOADING           = 'uploading',
  VALIDATING          = 'validating',
  QUEUED              = 'queued',
  EXTRACTING_AUDIO    = 'extracting_audio',
  TRANSCRIBING        = 'transcribing',
  DIARIZING           = 'diarizing',
  ANALYZING           = 'analyzing',
  GENERATING_PROTOCOL = 'generating_protocol',
  DONE                = 'done',
  FAILED              = 'failed',
}

export enum MeetingLanguage {
  MN    = 'mn',
  EN    = 'en',
  MIXED = 'mixed',
}

@Entity('meetings')
export class Meeting extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  workspace_id: string

  @Column({ type: 'uuid', nullable: true })
  folder_id: string | null

  @Column({ type: 'uuid', nullable: true })
  suggested_project_id: string | null

  @Column({ type: 'boolean', default: false })
  suggestion_dismissed: boolean

  @Column({ type: 'uuid' })
  created_by: string

  @Column({ type: 'text' })
  title: string

  @Column({ type: 'date' })
  meeting_date: Date

  @Column({ type: 'integer', nullable: true })
  duration_seconds: number | null

  @Column({ type: 'text', array: true, default: '{}' })
  participants: string[]

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.PENDING,
  })
  status: MeetingStatus

  @Column({
    type: 'enum',
    enum: MeetingLanguage,
    nullable: true,
  })
  language: MeetingLanguage | null

  @Column({ type: 'text', nullable: true })
  error_message: string | null

  @Column({ type: 'timestamptz', nullable: true })
  upload_started_at: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  upload_completed_at: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  processing_started_at: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  processing_completed_at: Date | null

  @Column({ type: 'text', nullable: true })
  file_path: string | null

  @ManyToOne(() => Workspace, (workspace) => workspace.meetings)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User
}
