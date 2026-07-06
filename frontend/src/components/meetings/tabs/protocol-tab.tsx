'use client'

import { format } from 'date-fns'
import { Loader2, Sparkles } from 'lucide-react'
import { C, ACTION_STATUSES, ACTION_STATUS_CONFIG, type ActionStatus } from '../constants'

interface ProtocolTabProps {
  protocol: any
  actionStatuses: Record<number, ActionStatus>
  onCycleActionStatus: (idx: number) => void
}

export function ProtocolTab({ protocol, actionStatuses, onCycleActionStatus }: ProtocolTabProps) {
  if (!protocol) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 0', borderRadius: 16, background: C.card, border: `1px solid ${C.border}` }}>
        <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
      </div>
    )
  }

  const urgent = (protocol.action_items ?? []).filter((a: any) => {
    if (!a.due_date) return false
    const diff = (new Date(a.due_date).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 7
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {urgent.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, borderRadius: 12, padding: '13px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚡</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', margin: '0 0 5px' }}>
              {urgent.length} action item{urgent.length > 1 ? 's' : ''} due this week
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {urgent.map((a: any, i: number) => (
                <p key={i} style={{ fontSize: 12, color: 'rgba(245,158,11,0.7)', margin: 0 }}>
                  · {a.task} — {a.due_date}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {protocol.summary && (
        <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.1)' }}>
              <Sparkles style={{ width: 13, height: 13, color: C.accentHi }} />
            </div>
            <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.accentHi, margin: 0 }}>Summary</h2>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.text2, margin: 0 }}>{protocol.summary}</p>
        </div>
      )}

      {protocol.agenda_items?.length > 0 && (
        <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 16px' }}>Agenda</h2>
          {protocol.agenda_items.map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < protocol.agenda_items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ fontSize: 13, color: C.text2 }}>{item.title}</span>
              {item.duration_min && (
                <span style={{ fontSize: 12, fontWeight: 500, borderRadius: 99, padding: '2px 10px', background: 'rgba(99,102,241,0.1)', color: C.accentHi }}>{item.duration_min}m</span>
              )}
            </div>
          ))}
        </div>
      )}

      {protocol.key_decisions?.length > 0 && (
        <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 16px' }}>Key Decisions</h2>
          <ol style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {protocol.key_decisions.map((d: any, i: number) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1, background: 'rgba(99,102,241,0.12)', color: C.accentHi, fontSize: 10, fontWeight: 800 }}>{i + 1}</span>
                <span style={{ fontSize: 13, lineHeight: 1.6, color: C.text2 }}>{d.decision ?? d}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {protocol.action_items?.length > 0 && (() => {
        const doneCount = protocol.action_items.filter((_: any, i: number) => actionStatuses[i] === 'done').length
        const pct = Math.round(doneCount / protocol.action_items.length * 100)
        return (
          <div style={{ borderRadius: 16, overflow: 'hidden', background: C.card, border: `1px solid ${C.border}` }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: 0 }}>Action Items</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.text3 }}>{doneCount}/{protocol.action_items.length} done</span>
                  <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 9px', background: pct === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.12)', color: pct === 100 ? '#34d399' : C.accentHi }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: pct === 100 ? '#10b981' : 'linear-gradient(90deg,#6366f1,#818cf8)', width: `${pct}%`, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {ACTION_STATUSES.map(st => {
                  const cfg = ACTION_STATUS_CONFIG[st]
                  const cnt = protocol.action_items.filter((_: any, i: number) => (actionStatuses[i] ?? 'todo') === st).length
                  return cnt > 0 ? <span key={st} style={{ fontSize: 10, color: cfg.color }}>{cfg.sym} {cnt} {cfg.label}</span> : null
                })}
              </div>
            </div>

            {protocol.action_items.map((item: any, i: number) => {
              const status = (actionStatuses[i] ?? 'todo') as ActionStatus
              const cfg = ACTION_STATUS_CONFIG[status]
              return (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', cursor: 'pointer', transition: 'background 0.1s', borderBottom: i < protocol.action_items.length - 1 ? `1px solid ${C.border}` : 'none', background: status === 'done' ? 'rgba(16,185,129,0.03)' : status === 'blocked' ? 'rgba(239,68,68,0.03)' : 'transparent' }}
                  onClick={() => onCycleActionStatus(i)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = status === 'done' ? 'rgba(16,185,129,0.06)' : status === 'blocked' ? 'rgba(239,68,68,0.06)' : C.surface }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = status === 'done' ? 'rgba(16,185,129,0.03)' : status === 'blocked' ? 'rgba(239,68,68,0.03)' : 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 22, borderRadius: 6, flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: 11, color: cfg.color, fontWeight: 700 }}>{cfg.sym}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: status === 'done' ? C.text3 : status === 'blocked' ? '#f87171' : C.text1, textDecoration: status === 'done' ? 'line-through' : 'none' }}>{item.task}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {item.due_date && <span style={{ fontSize: 11, color: C.text3 }}>{format(new Date(item.due_date), 'MMM d')}</span>}
                    {item.priority && (
                      <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 8px', ...(item.priority === 'high' ? { background: 'rgba(239,68,68,0.12)', color: '#f87171' } : item.priority === 'medium' ? { background: 'rgba(245,158,11,0.12)', color: '#fbbf24' } : { background: 'rgba(99,102,241,0.12)', color: C.accentHi }) }}>
                        {item.priority}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {protocol.open_questions?.length > 0 && (
        <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 16px' }}>Open Questions</h2>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {protocol.open_questions.map((q: any, i: number) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: C.text2 }}>
                <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', background: 'rgba(99,102,241,0.5)', flexShrink: 0 }} />
                {q.question ?? q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {protocol.next_meeting && (
        <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 12px' }}>Next Meeting</h2>
          {protocol.next_meeting.proposed_date && <p style={{ fontSize: 13, fontWeight: 600, color: C.text1, margin: '0 0 8px' }}>📅 {protocol.next_meeting.proposed_date}</p>}
          {protocol.next_meeting.topics?.length > 0 && (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {protocol.next_meeting.topics.map((t: string, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text2 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(99,102,241,0.4)', flexShrink: 0 }} />{t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
