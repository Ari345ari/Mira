'use client'

import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, FolderOpen, Loader2, Mic, Sparkles, Send, X } from 'lucide-react'
import { useProject } from '@/hooks/use-meetings'
import { C, LANG } from '@/components/meetings/constants'
import { MeetingStatusBadge } from '@/components/meetings/status-badge'
import api from '@/lib/api'

interface ChatMsg { role: 'user' | 'model'; text: string }

const SUGGESTIONS = [
  'Summarize all decisions made so far',
  'What action items are still open?',
  'When was the last meeting and what was discussed?',
]

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useProject(id)

  const project  = data?.project
  const meetings: any[] = data?.meetings ?? []

  // ── AI drawer ────────────────────────────────────────────────────
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [history, setHistory] = useState<ChatMsg[]>([])
  const [thinking, setThinking] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const drawerRef  = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history, thinking])

  // focus input when drawer opens
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120) }, [open])

  // close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || thinking) return
    setInput('')
    const next: ChatMsg[] = [...history, { role: 'user', text: msg }]
    setHistory(next)
    setThinking(true)
    try {
      const { data: res } = await api.post('/ai/chat', {
        message: msg,
        history: next.slice(0, -1),
        project_id: id,
      })
      setHistory([...next, { role: 'model', text: res.reply }])
    } catch {
      setHistory([...next, { role: 'model', text: 'Something went wrong. Please try again.' }])
    } finally {
      setThinking(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 39, backdropFilter: 'blur(2px)', transition: 'opacity 0.2s' }}
        />
      )}

      {/* ── AI Drawer ───────────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 40,
          width: 400,
          background: '#13131f',
          borderLeft: `1px solid rgba(99,102,241,0.18)`,
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: open ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: `1px solid rgba(255,255,255,0.07)`, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: 14, height: 14, color: '#818cf8' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, margin: 0 }}>AI Assistant</p>
            {project && <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>{project.name} · {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}</p>}
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text3, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = C.text1 }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.text3 }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '24px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Sparkles style={{ width: 22, height: 22, color: '#818cf8' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, margin: '0 0 4px' }}>Ask about this project</p>
                <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>
                  {meetings.length > 0 ? `Across all ${meetings.length} meetings` : 'Add meetings to get started'}
                </p>
              </div>
              {SUGGESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  style={{ textAlign: 'left', padding: '10px 13px', borderRadius: 10, fontSize: 12, color: C.text3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#818cf8' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text3 }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {history.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '88%', padding: '10px 13px',
                borderRadius: m.role === 'user' ? '13px 13px 4px 13px' : '13px 13px 13px 4px',
                fontSize: 13, lineHeight: 1.65,
                background: m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)',
                color: m.role === 'user' ? '#fff' : C.text2,
                border: m.role === 'model' ? `1px solid ${C.border}` : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {m.text}
              </div>
            </div>
          ))}

          {thinking && (
            <div style={{ display: 'flex' }}>
              <div style={{ padding: '10px 13px', borderRadius: '13px 13px 13px 4px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Loader2 style={{ width: 12, height: 12, color: '#818cf8' }} className="animate-spin" />
                <span style={{ fontSize: 12, color: C.text3 }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid rgba(255,255,255,0.07)`, display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          <textarea
            ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask about this project's meetings…"
            rows={1}
            style={{ flex: 1, resize: 'none', padding: '9px 12px', fontSize: 13, lineHeight: 1.5, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text1, outline: 'none', fontFamily: 'inherit', maxHeight: 100, overflowY: 'auto' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)')}
            onBlur={e => (e.currentTarget.style.borderColor = C.border)}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || thinking}
            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: 'none', background: input.trim() && !thinking ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.07)', color: input.trim() && !thinking ? '#fff' : 'rgba(255,255,255,0.25)', cursor: input.trim() && !thinking ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: input.trim() && !thinking ? '0 4px 14px rgba(99,102,241,0.35)' : 'none' }}>
            <Send style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.text3, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text2)} onMouseLeave={(e) => (e.currentTarget.style.color = C.text3)}>
            <ArrowLeft style={{ width: 13, height: 13 }} />Projects
          </Link>
          <span style={{ color: C.border }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>{project?.name ?? '…'}</span>
        </div>

        {/* Header */}
        {project && (
          <div style={{ borderRadius: 16, padding: '22px 24px', background: C.card, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: project.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FolderOpen style={{ width: 22, height: 22, color: project.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text1, margin: '0 0 4px', letterSpacing: '-0.03em' }}>{project.name}</h1>
              {project.description && <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>{project.description}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: project.color, margin: 0 }}>{meetings.length}</p>
                <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>meeting{meetings.length !== 1 ? 's' : ''}</p>
              </div>
              {/* Ask AI button */}
              <button
                onClick={() => setOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 15px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: open ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                  border: `1px solid ${open ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.2)'}`,
                  color: open ? '#818cf8' : C.text2,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#818cf8' }}
                onMouseLeave={(e) => { if (!open) { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = C.text2 } }}
              >
                <Sparkles style={{ width: 13, height: 13 }} />
                Ask AI
              </button>
            </div>
          </div>
        )}

        {/* Meetings list */}
        {meetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
            <Mic style={{ width: 28, height: 28, color: C.text3, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, color: C.text2, margin: '0 0 4px', fontWeight: 600 }}>No meetings yet</p>
            <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>Assign meetings to this project from the recording page.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Meetings</p>
            {meetings.map((m: any) => (
              <Link key={m.id} href={`/meetings/${m.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'border-color 0.12s, background 0.12s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.3)'; (e.currentTarget as HTMLDivElement).style.background = C.surface }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.background = C.card }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: project?.color ?? C.accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text1, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                    <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>
                      {format(new Date(m.meeting_date), 'MMM d, yyyy')}
                      {m.language ? ` · ${LANG[m.language] ?? m.language}` : ''}
                      {m.participants?.length ? ` · ${m.participants.length} attendees` : ''}
                    </p>
                  </div>
                  <MeetingStatusBadge status={m.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
