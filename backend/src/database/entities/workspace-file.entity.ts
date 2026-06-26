import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Workspace } from './workspace.entity'
import { User } from './user.entity'

@Entity('workspace_files')
export class WorkspaceFile extends BaseEntity {
  @Column({ type: 'uuid' })
  workspace_id: string

  @Column({ type: 'uuid' })
  uploader_id: string

  @Column({ type: 'text' })
  name: string

  @Column({ type: 'bigint' })
  size: number

  @Column({ type: 'text' })
  mime_type: string

  @Column({ type: 'text' })
  storage_path: string

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploader_id' })
  uploader: User
}
