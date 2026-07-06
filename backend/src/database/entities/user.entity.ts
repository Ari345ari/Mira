import { Entity, Column, OneToMany, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { WorkspaceMember } from './workspace-member.entity'

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  email: string

  @Column({ type: 'timestamptz', nullable: true })
  email_verified_at: Date | null

  @Column({ type: 'text', nullable: true, select: false })
  password_hash: string | null

  @Column({ type: 'text' })
  full_name: string

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null

  @Column({ type: 'varchar', length: 10, default: 'mn' })
  preferred_language: string

  @Column({ type: 'text', default: 'Asia/Ulaanbaatar' })
  timezone: string

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date | null

  @Column({ type: 'text', nullable: true, select: false })
  password_reset_token_hash: string | null

  @Column({ type: 'timestamptz', nullable: true, select: false })
  password_reset_expires_at: Date | null

  @OneToMany(() => WorkspaceMember, (member) => member.user)
  workspace_memberships: WorkspaceMember[]
}
