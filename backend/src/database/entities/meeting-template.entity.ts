import { Entity, Column, Index, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn } from 'typeorm'

@Entity('meeting_templates')
export class MeetingTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid' })
  workspace_id: string

  @Column({ type: 'text' })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 30, default: '#6366f1' })
  color: string

  @Column({
    type: 'jsonb',
    default: { summary: true, decisions: true, actions: true, questions: true, transcript: true },
  })
  sections: {
    summary: boolean
    decisions: boolean
    actions: boolean
    questions: boolean
    transcript: boolean
  }

  @Column({ type: 'jsonb', default: [] })
  custom_fields: Array<{
    id: string
    label: string
    type: 'text' | 'number' | 'date' | 'select'
    options?: string
    required: boolean
  }>

  @Column({
    type: 'jsonb',
    default: {
      company_name: '',
      doc_number_format: 'MTG-{YYYY}-{MM}-{SEQ}',
      show_page_numbers: true,
      show_doc_number_in_footer: true,
      signature_lines: ['Chairperson'],
    },
  })
  pdf_settings: {
    company_name: string
    doc_number_format: string
    show_page_numbers: boolean
    show_doc_number_in_footer: boolean
    signature_lines: string[]
  }

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null
}
