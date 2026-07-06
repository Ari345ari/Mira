'use client'

import { formatTime } from '@/lib/format'
import { C, SPEAKER_COLORS } from '../constants'

interface SpeakerStat {
  speaker: string
  words: number
  seconds: number
  pct: number
  color: typeof SPEAKER_COLORS[number]
}

interface AnalyticsTabProps {
  protocol: any
  transcript: any
  speakerStats: SpeakerStat[]
  duration: number
  mediaUrl: string | null
  onSeekTo: (t: number) => void
  onSetTab: (tab: string) => void
  speakerName: (raw: string) => string
  onRenameClick: (speaker: string) => void
}

const AGENDA_STATUS_CFG = {
  resolved: { label: 'Resolved', color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  discussed: { label: 'Discussed', color: '#818cf8', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)' },
  open:     { label: 'Open',     color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
}

export function AnalyticsTab({ protocol, transcript, speakerStats, duration, mediaUrl, onSeekTo, onSetTab, speakerName, onRenameClick }: AnalyticsTabProps) {
  if (!protocol) return null

  const decisions = protocol.key_decisions?.length ?? 0
  const openQ     = protocol.open_questions?.length ?? 0
  const hasNext   = !!protocol.next_meeting?.proposed_date
  const s         = decisions * 2 - openQ + (hasNext ? 1 : 0)
  const sentiment = {
    label: s >= 5 ? 'Highly Productive' : s >= 3 ? 'Productive' : s >= 1 ? 'Mixed Results' : 'Needs Follow-up',
    color: s >= 5 ? '#34d399' : s >= 3 ? '#818cf8' : s >= 1 ? '#fbbf24' : '#f87171',
    desc: s >= 5
      ? `Strong meeting — ${decisions} decision${decisions !== 1 ? 's' : ''} made and all questions resolved.`
      : s >= 3
      ? `${decisions} decision${decisions !== 1 ? 's' : ''} reached${openQ > 0 ? `, ${openQ} question${openQ !== 1 ? 's' : ''} remain open` : ''}.`
      : s >= 1
      ? `Progress made but ${openQ} question${openQ !== 1 ? 's' : ''} remain unresolved.`
      : `${openQ} open question${openQ !== 1 ? 's' : ''} without clear resolution — consider a follow-up.`,
  }

  const agendaItems: any[] = protocol.agenda_items ?? []
  const agendaCompletion = agendaItems.length > 0 ? (() => {
    const dec = (protocol.key_decisions ?? []) as any[]
    const oqs = (protocol.open_questions ?? []) as any[]
    const statuses = agendaItems.map((item: any) => {
      const words = (item.title ?? '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
      if (dec.some((d: any) => words.some((w: string) => (d.decision ?? '').toLowerCase().includes(w)))) return 'resolved' as const
      if (oqs.some((q: any) => words.some((w: string) => (q.question ?? '').toLowerCase().includes(w)))) return 'open' as const
      return 'discussed' as const
    })
    const resolved = statuses.filter(st => st === 'resolved').length
    return { items: agendaItems, statuses, pct: Math.round(resolved / agendaItems.length * 100) }
  })() : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Outcome */}
      <div style={{ borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${sentiment.color}`, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3 }}>Meeting Outcome</span>
              <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${sentiment.color}1f`, color: sentiment.color }}>{sentiment.label}</span>
            </div>
            <p style={{ fontSize: 13, color: C.text2, margin: 0, lineHeight: 1.6 }}>{sentiment.desc}</p>
          </div>
          <div style={{ display: 'flex', gap: 1, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            {[
              { label: 'Decisions', value: decisions, color: '#818cf8' },
              { label: 'Open Qs',   value: openQ, color: openQ > 0 ? '#fbbf24' : '#34d399' },
              { label: 'Next Mtg',  value: protocol.next_meeting?.proposed_date ?? '—', color: protocol.next_meeting ? '#34d399' : C.text3, small: true },
            ].map(({ label, value, color, small }) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px 18px', background: C.surface }}>
                <p style={{ fontSize: small ? 12 : 24, fontWeight: 800, color, margin: 0, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</p>
                <p style={{ fontSize: 10, color: C.text3, margin: '3px 0 0', whiteSpace: 'nowrap' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agenda completion */}
      {agendaCompletion && (
        <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: 0 }}>Agenda Completion</p>
            <span style={{ fontSize: 14, fontWeight: 800, color: agendaCompletion.pct === 100 ? '#34d399' : C.accentHi, letterSpacing: '-0.02em' }}>{agendaCompletion.pct}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ height: '100%', borderRadius: 3, background: agendaCompletion.pct === 100 ? '#34d399' : C.accent, width: `${agendaCompletion.pct}%`, transition: 'width 0.7s ease' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {agendaCompletion.items.map((item: any, i: number) => {
              const st  = agendaCompletion.statuses[i]
              const cfg = AGENDA_STATUS_CFG[st]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, flexShrink: 0, width: 60, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</span>
                  <span style={{ fontSize: 13, color: C.text2, flex: 1 }}>{item.title}</span>
                  {item.duration_min && <span style={{ fontSize: 11, color: C.text3 }}>{item.duration_min}m</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Talk time */}
      {speakerStats.length > 0 && (
        <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 18px' }}>Talk Time Distribution</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {speakerStats.map(({ speaker, words, seconds, pct, color }) => (
              <div key={speaker}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color.bar }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text1, cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.15)' }} title="Click to rename" onClick={() => onRenameClick(speaker)}>
                      {speakerName(speaker)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: C.text3 }}>{words} words</span>
                    <span style={{ fontSize: 11, color: C.text3 }}>{formatTime(seconds)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: color.text }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: color.bar, width: `${pct}%`, transition: 'width 0.7s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speaker timeline */}
      {speakerStats.length > 0 && duration > 0 && (
        <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 18px' }}>Speaker Timeline</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {speakerStats.map(({ speaker, color }) => (
              <div key={speaker} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 72, flexShrink: 0, fontSize: 11, fontWeight: 500, textAlign: 'right', color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{speakerName(speaker)}</span>
                <div style={{ flex: 1, height: 22, borderRadius: 6, overflow: 'hidden', position: 'relative', background: 'rgba(255,255,255,0.04)' }}>
                  {(transcript?.speaker_turns as any[] ?? []).filter(t => t.speaker === speaker).map((t, i) => (
                    <div key={i}
                      style={{ position: 'absolute', top: 2, bottom: 2, borderRadius: 3, cursor: 'pointer', left: `${(t.start / duration) * 100}%`, width: `${Math.max(0.4, (t.end - t.start) / duration * 100)}%`, background: color.bar, opacity: 0.8, transition: 'opacity 0.1s' }}
                      onClick={() => { onSeekTo(t.start); onSetTab('transcript') }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                      title={`${formatTime(t.start)} — ${t.text?.slice(0, 60)}…`}
                    />
                  ))}
                  {mediaUrl && <div style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)', pointerEvents: 'none', left: `${(0 / duration) * 100}%` }} />}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <span style={{ width: 72, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: C.text3 }}>0:00</span>
                <span style={{ fontSize: 10, color: C.text3 }}>{formatTime(duration / 2)}</span>
                <span style={{ fontSize: 10, color: C.text3 }}>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
