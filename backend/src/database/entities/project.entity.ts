import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Workspace } from './workspace.entity'

@Entity('projects')
export class Project extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  workspace_id: string

  @Column({ type: 'uuid' })
  created_by: string

  @Column({ type: 'text' })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 7, default: '#6366f1' })
  color: string

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace
}
