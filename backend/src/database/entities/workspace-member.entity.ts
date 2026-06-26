import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { User } from './user.entity'
import { Workspace } from './workspace.entity'

export enum WorkspaceRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

@Entity('workspace_members')
export class WorkspaceMember {
  @Column({ primary: true, type: 'uuid', generated: 'uuid' })
  id: string

  @Index()
  @Column({ type: 'uuid' })
  workspace_id: string

  @Index()
  @Column({ type: 'uuid' })
  user_id: string

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.VIEWER,
  })
  role: WorkspaceRole

  @Column({ type: 'uuid', nullable: true })
  invited_by: string | null

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  joined_at: Date

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date

  @ManyToOne(() => Workspace, (workspace) => workspace.members)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace

  @ManyToOne(() => User, (user) => user.workspace_memberships)
  @JoinColumn({ name: 'user_id' })
  user: User
}
