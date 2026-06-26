import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { User } from './user.entity'
import { WorkspaceMember } from './workspace-member.entity'
import { Meeting } from './meeting.entity'

@Entity('workspaces')
export class Workspace extends BaseEntity {
  @Column({ type: 'text' })
  name: string

  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string

  @Column({ type: 'text', nullable: true })
  logo_url: string | null

  @Column({ type: 'uuid' })
  owner_id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User

  @Column({ type: 'varchar', length: 20, default: 'free' })
  plan: string

  @Column({ type: 'bigint', default: 10737418240 }) // 10GB
  storage_quota_bytes: number

  @Column({ type: 'bigint', default: 0 })
  storage_used_bytes: number

  @Column({ type: 'boolean', default: true })
  allow_external_sharing: boolean

  @Column({ type: 'integer', nullable: true })
  data_retention_days: number | null

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members: WorkspaceMember[]

  @OneToMany(() => Meeting, (meeting) => meeting.workspace)
  meetings: Meeting[]
}
