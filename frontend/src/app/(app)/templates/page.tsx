'use client'

import { useState, useCallback } from 'react'
import { useWorkspaceStore } from '@/store/workspace'
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '@/hooks/use-meetings'
import toast from 'react-hot-toast'
import {
  LayoutTemplate, Plus, X, GripVertical, ChevronRight, Check, Loader2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CustomField {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: string
  required: boolean
}

interface Template {
  id: string
  name: string
  description: string | null
  color: string
  sections: {
    summary: boolean
    decisions: boolean
    actions: boolean
    questions: boolean
    transcript: boolean
  }
  custom_fields: CustomField[]
  pdf_settings: {
    company_name: string
    doc_number_format: string
    show_page_numbers: boolean
    show_doc_number_in_footer: boolean
    signature_lines: string[]
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

const FIELD_TYPES = [
  { value: 'text',   label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date',   label: 'Date' },
  { value: 'select', label: 'Dropdown' },
]

const SECTIONS_META = [
  { key: 'summary' as const,   label: 'Summary',        desc: 'AI-generated meeting summary' },
  { key: 'decisions' as const, label: 'Key Decisions',  desc: 'Decisions made during the meeting' },
  { key: 'actions' as const,   label: 'Action Items',   desc: 'Tasks with owners and due dates' },
  { key: 'questions' as const, label: 'Open Questions', desc: 'Unresolved questions for follow-up' },
  { key: 'transcript' as const,'label': 'Transcript',   desc: 'Full speaker-labelled transcript in PDF' },
]

function uid() { return Math.random().toString(36).slice(2) }

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} role="switch" aria-checked={on}
      style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
        background: on ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.1)',
        boxShadow: on ? '0 2px 10px rgba(99,102,241,0.3)' : 'none' }}>
      <span style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: on ? 18 : 2, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  )
}

// ── Editor ─────────────────────────────────────────────────────────────────────
function TemplateEditor({
  tpl, saving, onSave, onDelete,
}: {
  tpl: Template
  saving: boolean
  onSave: (data: Partial<Template>) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState<Template>(tpl)
  const [addingField, setAddingField] = useState(false)
  const [newField, setNewField] = useState<Omit<CustomField, 'id'>>({ label: '', type: 'text', required: false })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isDirty = JSON.stringify(draft) !== JSON.stringify(tpl)

  const set = <K extends keyof Template>(k: K, v: Template[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  const setPdf = <K extends keyof Template['pdf_settings']>(k: K, v: Template['pdf_settings'][K]) =>
    setDraft(d => ({ ...d, pdf_settings: { ...d.pdf_settings, [k]: v } }))

  const setSection = (k: keyof Template['sections'], v: boolean) =>
    setDraft(d => ({ ...d, sections: { ...d.sections, [k]: v } }))

  function addField() {
    if (!newField.label.trim()) return
    setDraft(d => ({ ...d, custom_fields: [...d.custom_fields, { ...newField, id: uid() }] }))
    setNewField({ label: '', type: 'text', required: false })
    setAddingField(false)
  }

  function removeField(id: string) {
    setDraft(d => ({ ...d, custom_fields: d.custom_fields.filter(f => f.id !== id) }))
  }

  function addSignature() {
    setPdf('signature_lines', [...draft.pdf_settings.signature_lines, ''])
  }

  function setSignature(i: number, v: string) {
    const lines = [...draft.pdf_settings.signature_lines]
    lines[i] = v
    setPdf('signature_lines', lines)
  }

  function removeSignature(i: number) {
    setPdf('signature_lines', draft.pdf_settings.signature_lines.filter((_, j) => j !== i))
  }

  const docPreview = draft.pdf_settings.doc_number_format
    .replace('{YYYY}', '2026').replace('{MM}', '07').replace('{DD}', '01').replace('{WW}', '27').replace('{SEQ}', '001')

  const SLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '24px 0 10px' }}>
      {children}
    </p>
  )

  const inp = {
    display: 'block' as const, width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 11px',
    fontSize: 13, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky save bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,13,20,0.95)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: draft.color }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{draft.name || 'Untitled'}</span>
          {isDirty && <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 99, padding: '1px 7px' }}>Unsaved</span>}
        </div>
        <button
          disabled={!isDirty || saving}
          onClick={() => onSave(draft)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: isDirty && !saving ? 'pointer' : 'default', transition: 'all 0.15s',
            background: isDirty ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)',
            color: isDirty ? '#fff' : 'rgba(255,255,255,0.25)',
            boxShadow: isDirty ? '0 4px 12px rgba(99,102,241,0.3)' : 'none' }}>
          {saving ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 12, height: 12 }} />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 40px' }}>

        {/* Basic info */}
        <SLabel>Basic info</SLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 5 }}>Template name</label>
            <input value={draft.name} onChange={e => set('name', e.target.value)}
              style={inp} placeholder="e.g. Board Meeting"
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 5 }}>Description</label>
            <input value={draft.description ?? ''} onChange={e => set('description', e.target.value)}
              style={inp} placeholder="When is this template used?"
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 8 }}>Color</label>
            <div style={{ display: 'flex', gap: 7 }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: draft.color === c ? '2.5px solid #fff' : '2.5px solid transparent', cursor: 'pointer', flexShrink: 0, position: 'relative', transition: 'transform 0.1s', transform: draft.color === c ? 'scale(1.15)' : 'scale(1)' }}>
                  {draft.color === c && <Check style={{ position: 'absolute', inset: 0, margin: 'auto', width: 11, height: 11, color: '#fff' }} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sections */}
        <SLabel>Protocol sections</SLabel>
        <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {SECTIONS_META.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: i < SECTIONS_META.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{s.desc}</p>
              </div>
              <Toggle on={draft.sections[s.key]} onToggle={() => setSection(s.key, !draft.sections[s.key])} />
            </div>
          ))}
        </div>

        {/* Custom fields */}
        <SLabel>Custom fields</SLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {draft.custom_fields.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <GripVertical style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{f.label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  {FIELD_TYPES.find(t => t.value === f.type)?.label}
                  {f.required ? ' · required' : ' · optional'}
                  {f.type === 'select' && f.options ? ` · ${f.options.split(',').filter(Boolean).length} options` : ''}
                </p>
              </div>
              <button onClick={() => removeField(f.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 3, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ))}

          {addingField ? (
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newField.label} onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                  placeholder="Field label" style={{ ...inp, flex: 1, width: 'auto' }}
                  onKeyDown={e => e.key === 'Enter' && addField()} autoFocus
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                <select value={newField.type} onChange={e => setNewField(f => ({ ...f, type: e.target.value as any }))}
                  style={{ ...inp, width: 110, flex: 'none' }}>
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {newField.type === 'select' && (
                <input value={newField.options ?? ''} onChange={e => setNewField(f => ({ ...f, options: e.target.value }))}
                  placeholder="Options, comma-separated (e.g. Option A, Option B)"
                  style={inp}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
                  <Toggle on={newField.required} onToggle={() => setNewField(f => ({ ...f, required: !f.required }))} />
                  Required field
                </label>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => { setAddingField(false); setNewField({ label: '', type: 'text', required: false }) }}
                    style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={addField} disabled={!newField.label.trim()}
                    style={{ padding: '5px 13px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', cursor: newField.label.trim() ? 'pointer' : 'default', opacity: newField.label.trim() ? 1 : 0.4 }}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingField(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'transparent', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#818cf8' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
              <Plus style={{ width: 12, height: 12 }} />Add custom field
            </button>
          )}
        </div>

        {/* PDF settings */}
        <SLabel>PDF export settings</SLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 5 }}>Company / organisation name</label>
            <input value={draft.pdf_settings.company_name} onChange={e => setPdf('company_name', e.target.value)}
              style={inp} placeholder="e.g. Acme Corp"
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 5 }}>Document number format</label>
            <input value={draft.pdf_settings.doc_number_format} onChange={e => setPdf('doc_number_format', e.target.value)}
              style={{ ...inp, fontFamily: 'monospace' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              Tokens:&nbsp;
              {['{YYYY}', '{MM}', '{DD}', '{WW}', '{SEQ}'].map(t => (
                <code key={t} style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, marginRight: 4 }}>{t}</code>
              ))}
            </p>
            {draft.pdf_settings.doc_number_format && (
              <p style={{ fontSize: 11, color: '#818cf8', marginTop: 3 }}>Preview: {docPreview}</p>
            )}
          </div>

          <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {[
              { key: 'show_page_numbers' as const,       label: 'Show page numbers',              desc: 'e.g. 1 / 3 in the footer' },
              { key: 'show_doc_number_in_footer' as const, label: 'Repeat doc number in footer',  desc: 'Shows the document number on every page' },
            ].map(({ key, label, desc }, i, arr) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{desc}</p>
                </div>
                <Toggle on={draft.pdf_settings[key]} onToggle={() => setPdf(key, !draft.pdf_settings[key])} />
              </div>
            ))}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 8 }}>Signature lines</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {draft.pdf_settings.signature_lines.map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <input value={line} onChange={e => setSignature(i, e.target.value)}
                    placeholder={`Signatory ${i + 1}`}
                    style={{ ...inp, flex: 1, width: 'auto' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                  <button onClick={() => removeSignature(i)}
                    style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#f87171' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ))}
              <button onClick={addSignature}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'transparent', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#818cf8' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
                <Plus style={{ width: 12, height: 12 }} />Add signature line
              </button>
            </div>
          </div>
        </div>

        {/* Delete */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
              Delete this template
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#f87171' }}>Are you sure?</span>
              <button onClick={onDelete}
                style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#ef4444', border: 'none', borderRadius: 7, padding: '4px 12px', cursor: 'pointer' }}>
                Delete
              </button>
              <button onClick={() => setConfirmDelete(false)}
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const { activeWsId } = useWorkspaceStore()
  const { data: templates = [], isLoading } = useTemplates(activeWsId)
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()
  const deleteMutation = useDeleteTemplate()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const selectedTemplate: Template | null = templates.find((t: Template) => t.id === selectedId) ?? templates[0] ?? null
  const activeId = selectedId ?? selectedTemplate?.id ?? null

  const handleCreate = useCallback(async () => {
    if (!activeWsId) return
    try {
      const created = await createMutation.mutateAsync({
        workspaceId: activeWsId,
        data: {
          name: 'New template',
          description: null,
          color: '#6366f1',
          sections: { summary: true, decisions: true, actions: true, questions: true, transcript: false },
          custom_fields: [],
          pdf_settings: {
            company_name: '',
            doc_number_format: 'MTG-{YYYY}-{MM}-{SEQ}',
            show_page_numbers: true,
            show_doc_number_in_footer: true,
            signature_lines: ['Chairperson'],
          },
        },
      })
      setSelectedId(created.id)
    } catch {
      toast.error('Failed to create template')
    }
  }, [activeWsId, createMutation])

  const handleSave = useCallback(async (tpl: Template, data: Partial<Template>) => {
    if (!activeWsId) return
    setSavingId(tpl.id)
    try {
      await updateMutation.mutateAsync({ workspaceId: activeWsId, id: tpl.id, data })
      toast.success('Template saved')
    } catch {
      toast.error('Failed to save template')
    } finally {
      setSavingId(null)
    }
  }, [activeWsId, updateMutation])

  const handleDelete = useCallback(async (id: string) => {
    if (!activeWsId) return
    try {
      await deleteMutation.mutateAsync({ workspaceId: activeWsId, id })
      setSelectedId(null)
      toast.success('Template deleted')
    } catch {
      toast.error('Failed to delete template')
    }
  }, [activeWsId, deleteMutation])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page header */}
      <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutTemplate style={{ width: 15, height: 15, color: '#818cf8' }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e2e8f0', margin: 0, letterSpacing: '-0.03em' }}>Templates</h1>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Define meeting types with custom fields and PDF export settings for your workspace
          </p>
        </div>
        <button onClick={handleCreate} disabled={createMutation.isPending}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)', flexShrink: 0 }}>
          {createMutation.isPending ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: 13, height: 13 }} />}
          New template
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List sidebar */}
        <div style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '12px 8px', overflowY: 'auto', flexShrink: 0 }}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            ))
          ) : templates.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>No templates yet</p>
            </div>
          ) : (
            templates.map((t: Template) => {
              const isActive = t.id === activeId
              return (
                <button key={t.id} onClick={() => setSelectedId(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 10px', borderRadius: 10, marginBottom: 3, background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent', border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#818cf8' : '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                      {t.custom_fields.length > 0 ? `+${t.custom_fields.length} field${t.custom_fields.length !== 1 ? 's' : ''}` : 'Base fields only'}
                    </p>
                  </div>
                  {isActive && <ChevronRight style={{ width: 11, height: 11, color: '#818cf8', flexShrink: 0 }} />}
                </button>
              )
            })
          )}
        </div>

        {/* Editor pane */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!activeId || templates.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayoutTemplate style={{ width: 22, height: 22, color: 'rgba(99,102,241,0.6)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>No templates yet</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 20px', maxWidth: 320 }}>
                  Create your first template to standardise meeting minutes and PDF exports across your workspace.
                </p>
                <button onClick={handleCreate}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                  <Plus style={{ width: 13, height: 13 }} />Create first template
                </button>
              </div>
              <div style={{ marginTop: 8, padding: '14px 20px', borderRadius: 12, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', maxWidth: 380, textAlign: 'left' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', margin: '0 0 5px' }}>Base fields — always included</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.7 }}>
                  Title · Date &amp; time · Location · Meeting type · Participants (name + job title) · Chairperson · Transcript (speaker-labelled)
                </p>
              </div>
            </div>
          ) : (
            <TemplateEditor
              key={activeId}
              tpl={templates.find((t: Template) => t.id === activeId)!}
              saving={savingId === activeId}
              onSave={(data) => handleSave(templates.find((t: Template) => t.id === activeId)!, data)}
              onDelete={() => handleDelete(activeId)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
