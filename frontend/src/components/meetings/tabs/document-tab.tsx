'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Loader2, Download, LayoutTemplate, ChevronDown, Check } from 'lucide-react'
import { C, LANG } from '../constants'
import { EditableField } from '../editable-field'

interface Template {
  id: string
  name: string
  color: string
  sections: {
    summary: boolean
    decisions: boolean
    actions: boolean
    questions: boolean
    transcript: boolean
  }
  pdf_settings: {
    company_name: string
    doc_number_format: string
    show_page_numbers: boolean
    show_doc_number_in_footer: boolean
    signature_lines: string[]
  }
}

interface DocumentTabProps {
  protocol: any
  meeting: any
  notes: Record<string, string>
  onUpdateNote: (key: string, value: string) => void
  onExport: () => void
  docEdits: Record<string, string>
  onDocEdit: (key: string, value: string) => void
  speakerTurns?: any[]
  speakerName?: (raw: string) => string
  templates?: Template[]
}

// ─── A4 page style ────────────────────────────────────────────────────────────
const PAGE: React.CSSProperties = {
  width: '21cm',
  minHeight: '29.7cm',
  padding: '2.5cm',
  background: '#fff',
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '12pt',
  lineHeight: 1.15,
  color: '#000',
  boxSizing: 'border-box',
  flexShrink: 0,
}

const P: React.CSSProperties = {
  margin: 0,
  textIndent: '1.25cm',
  textAlign: 'justify',
  lineHeight: 1.15,
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '12pt',
}

const B: React.CSSProperties = {
  margin: 0,
  fontWeight: 700,
  lineHeight: 1.15,
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '12pt',
  textIndent: 0,
}

function Gap({ h = '0.35cm' }: { h?: string }) {
  return <div style={{ height: h, flexShrink: 0 }} />
}

function EP({
  value, editKey, meetingId, onEdit, style, multiline = true,
}: {
  value: string; editKey: string; meetingId: string
  onEdit: (k: string, v: string) => void
  style?: React.CSSProperties; multiline?: boolean
}) {
  return (
    <EditableField
      value={value}
      onChange={(v) => onEdit(editKey, v)}
      multiline={multiline}
      meetingId={meetingId}
      light="document"
      style={{ ...P, display: 'block', ...style }}
    />
  )
}

// ─── Format doc number ────────────────────────────────────────────────────────
function formatDocNumber(fmt: string, date: Date, fallbackId: string) {
  const pad = (n: number, l = 2) => String(n).padStart(l, '0')
  const week = Math.ceil(((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)
  return fmt
    .replace('{YYYY}', String(date.getFullYear()))
    .replace('{MM}',   pad(date.getMonth() + 1))
    .replace('{DD}',   pad(date.getDate()))
    .replace('{WW}',   pad(week))
    .replace('{SEQ}',  fallbackId.slice(0, 3).toUpperCase())
}

// ─── Template picker ──────────────────────────────────────────────────────────
function TemplatePicker({ templates, selected, onSelect }: {
  templates: Template[]
  selected: Template | null
  onSelect: (t: Template | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${open ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.12)'}`, background: open ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.07)', color: selected ? '#e2e8f0' : C.text3, transition: 'all 0.15s' }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' } }}
      >
        {selected
          ? <><div style={{ width: 8, height: 8, borderRadius: '50%', background: selected.color, flexShrink: 0 }} />{selected.name}</>
          : <><LayoutTemplate style={{ width: 11, height: 11 }} />Template</>
        }
        <ChevronDown style={{ width: 11, height: 11, opacity: 0.5, transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, minWidth: 200, borderRadius: 12, background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          {/* No template option */}
          <button
            onClick={() => { onSelect(null); setOpen(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px', background: !selected ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.1s' }}
            onMouseEnter={e => { if (selected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { if (selected) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: !selected ? '#818cf8' : C.text2, flex: 1 }}>Default (no template)</span>
            {!selected && <Check style={{ width: 11, height: 11, color: '#818cf8' }} />}
          </button>

          {templates.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: C.text3 }}>
              No templates yet —{' '}
              <a href="/templates" style={{ color: '#818cf8', textDecoration: 'none' }}>create one</a>
            </div>
          ) : (
            templates.map(t => (
              <button
                key={t.id}
                onClick={() => { onSelect(t); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px', background: selected?.id === t.id ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (selected?.id !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (selected?.id !== t.id) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: selected?.id === t.id ? '#818cf8' : '#e2e8f0', flex: 1 }}>{t.name}</span>
                {selected?.id === t.id && <Check style={{ width: 11, height: 11, color: '#818cf8' }} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DocumentTab({
  protocol, meeting, onExport, docEdits, onDocEdit, templates = [],
}: DocumentTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  if (!protocol) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 0', borderRadius: 16, background: C.card, border: `1px solid ${C.border}` }}>
        <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
      </div>
    )
  }

  const tpl = selectedTemplate
  const sections = tpl?.sections
  const pdf = tpl?.pdf_settings

  const langLabel = meeting.language ? (LANG[meeting.language] ?? meeting.language) : null
  const participants: string[] = meeting.participants ?? []

  const meetingDate = new Date(meeting.meeting_date)
  const docNumber = pdf
    ? formatDocNumber(pdf.doc_number_format, meetingDate, meeting.id ?? '001')
    : `No.: ${meeting.id?.slice(0, 8).toUpperCase() ?? '01'}`

  const companyName = pdf?.company_name?.trim() || meeting.workspace_name
  const signatureLines: string[] = pdf?.signature_lines?.length
    ? pdf.signature_lines
    : ['Committee Staff Responsible\nfor the Meeting']

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#818cf8,#6366f1)' }} />

      {/* Toolbar */}
      <div style={{ padding: '12px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Document</span>
          <span style={{ fontSize: 10, color: 'rgba(99,102,241,0.5)' }}>· click any field to edit</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Template picker */}
          <TemplatePicker
            templates={templates}
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
          />

          {/* PDF print */}
          <button
            onClick={() => {
              const el = document.getElementById('mira-doc-page')
              if (!el) return
              const win = window.open('', '_blank', 'width=900,height=700')
              if (!win) return
              win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${meeting.title} — Meeting Minutes</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;padding:0;background:#fff}svg[data-pencil]{display:none!important}div[role=button]{border-color:transparent!important;background:transparent!important;cursor:default!important}button{display:none!important}textarea,input{border:none!important;outline:none!important;background:transparent!important;resize:none!important;padding:0!important}</style></head><body>${el.outerHTML}</body></html>`)
              win.document.close()
              win.focus()
              setTimeout(() => win.print(), 400)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.07)', color: '#c9d8ea', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
          >
            <Download style={{ width: 12, height: 12 }} />PDF
          </button>

          {/* DOCX export */}
          <button
            onClick={onExport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', cursor: 'pointer', border: 'none', boxShadow: '0 3px 10px rgba(99,102,241,0.3)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 5px 18px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 3px 10px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = '' }}
          >
            <Download style={{ width: 12, height: 12 }} />DOCX
          </button>
        </div>
      </div>

      {/* A4 page */}
      <div style={{ background: '#2e2b47', padding: '40px 32px', overflowX: 'auto' }}>
        <div id="mira-doc-page" style={PAGE}>

          {/* Title block */}
          {companyName && (
            <p style={{ ...B, fontSize: '16pt', textAlign: 'center', textTransform: 'uppercase', margin: 0 }}>
              {companyName}
            </p>
          )}
          <p style={{ ...B, fontSize: '16pt', textAlign: 'center', textTransform: 'uppercase', margin: 0 }}>
            {meeting.title}
          </p>
          <p style={{ ...B, fontSize: '16pt', textAlign: 'center', textTransform: 'uppercase', margin: 0 }}>
            Meeting Minutes
          </p>

          <Gap h="0.6cm" />

          {/* Info line */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: 1.15 }}>
            <span>{format(meetingDate, 'MMMM d, yyyy')}</span>
            <span style={{ fontWeight: 700 }}>{docNumber}</span>
            <span>{langLabel ?? ''}</span>
          </div>

          <Gap h="0.5cm" />

          {/* Summary */}
          {(!sections || sections.summary) && protocol.summary && (
            <>
              <EP
                value={docEdits['summary'] ?? protocol.summary}
                editKey="summary"
                meetingId={meeting.id}
                onEdit={onDocEdit}
              />
              <Gap />
            </>
          )}

          {/* Attendees (always shown — it's a base field) */}
          {participants.length > 0 && (
            <>
              <p style={P}>
                <b>Attendees ({participants.length}):</b>{' '}{participants.join(', ')}.
              </p>
              <Gap />
            </>
          )}

          {/* By majority vote */}
          {protocol.agenda_items?.length > 0 && (
            <>
              <p style={{ ...B, textAlign: 'center' }}>By majority vote, the meeting commenced.</p>
              <Gap h="0.6cm" />
            </>
          )}

          {/* Agenda items */}
          {protocol.agenda_items?.map((item: any, i: number) => (
            <div key={i}>
              <p style={{ ...B, textTransform: 'uppercase' }}>
                Agenda Item {i + 1}: {item.title}
                {item.duration_min ? ` (${item.duration_min} min)` : ''}
              </p>
              <Gap h="0.25cm" />
            </div>
          ))}
          {protocol.agenda_items?.length > 0 && <Gap h="0.3cm" />}

          {/* Key decisions */}
          {(!sections || sections.decisions) && protocol.key_decisions?.length > 0 && (
            <>
              <p style={{ ...B, textTransform: 'uppercase' }}>Decisions Made:</p>
              <Gap h="0.2cm" />
              {protocol.key_decisions.map((d: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '0.4cm', alignItems: 'flex-start', marginBottom: '0.2cm' }}>
                  <span style={{ ...B, flexShrink: 0, minWidth: '0.6cm' }}>{i + 1}.</span>
                  <EP
                    value={docEdits[`decision-${i}`] ?? (d.decision ?? String(d))}
                    editKey={`decision-${i}`}
                    meetingId={meeting.id}
                    onEdit={onDocEdit}
                    style={{ textIndent: 0, flex: 1 }}
                  />
                </div>
              ))}
              <Gap />
            </>
          )}

          {/* Action items */}
          {(!sections || sections.actions) && protocol.action_items?.length > 0 && (
            <>
              <p style={{ ...B, textTransform: 'uppercase' }}>Assigned Tasks:</p>
              <Gap h="0.2cm" />
              {protocol.action_items.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '0.4cm', alignItems: 'flex-start', marginBottom: '0.2cm' }}>
                  <span style={{ ...B, flexShrink: 0, minWidth: '0.6cm' }}>{i + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <EP
                      value={docEdits[`action-${i}`] ?? item.task}
                      editKey={`action-${i}`}
                      meetingId={meeting.id}
                      onEdit={onDocEdit}
                      style={{ textIndent: 0 }}
                    />
                    {item.due_date && (
                      <p style={{ ...P, textIndent: 0, fontSize: '11pt', fontStyle: 'italic', color: '#444' }}>
                        Deadline: {item.due_date}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <Gap />
            </>
          )}

          {/* Open questions */}
          {(!sections || sections.questions) && protocol.open_questions?.length > 0 && (
            <>
              <p style={{ ...B, textTransform: 'uppercase' }}>Unresolved Matters:</p>
              <Gap h="0.2cm" />
              {protocol.open_questions.map((q: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '0.4cm', alignItems: 'flex-start', marginBottom: '0.2cm' }}>
                  <span style={{ ...B, flexShrink: 0, minWidth: '0.6cm' }}>{i + 1}.</span>
                  <EP
                    value={docEdits[`question-${i}`] ?? (q.question ?? String(q))}
                    editKey={`question-${i}`}
                    meetingId={meeting.id}
                    onEdit={onDocEdit}
                    style={{ textIndent: 0, flex: 1 }}
                  />
                </div>
              ))}
              <Gap />
            </>
          )}

          {/* Next meeting */}
          {protocol.next_meeting?.proposed_date && (
            <>
              <p style={P}>
                <b>Next meeting:</b>{' '}{protocol.next_meeting.proposed_date}
                {protocol.next_meeting.topics?.length
                  ? ' — ' + protocol.next_meeting.topics.join(', ')
                  : ''}
              </p>
              <Gap />
            </>
          )}

          {/* Closing */}
          <Gap h="0.6cm" />
          <p style={{ ...P, textIndent: 0 }}>The meeting concluded.</p>

          {/* Signature block */}
          <Gap h="1.4cm" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2cm', fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: 1.5 }}>
            {signatureLines.map((line, i) => (
              <p key={i} style={{ margin: 0, flex: 1, textAlign: i === signatureLines.length - 1 ? 'right' : 'left' }}>
                {line || `Signatory ${i + 1}`}
              </p>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
