import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Workspace } from './workspace.entity'
import { User } from './user.entity'
import { WorkspaceRole } from './workspace-member.entity'

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

@Entity('workspace_invites')
export class WorkspaceInvite {
  @Column({ primary: true, type: 'uuid', generated: 'uuid' })
  id: string

  @Index()
  @Column({ type: 'uuid' })
  workspace_id: string

  @Index()
  @Column({ type: 'uuid' })
  invitee_id: string

  @Column({ type: 'uuid' })
  inviter_id: string

  @Column({ type: 'enum', enum: WorkspaceRole, default: WorkspaceRole.VIEWER })
  role: WorkspaceRole

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: InviteStatus

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date

  @Column({ type: 'timestamptz', nullable: true })
  responded_at: Date | null

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitee_id' })
  invitee: User

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviter_id' })
  inviter: User
}
