'use client'

import { useState, useMemo } from 'react'
import { Loader2, Search, X, Zap, ChevronDown } from 'lucide-react'
import { C, SPEAKER_COLORS } from '../constants'

interface TranscriptTabProps {
  transcript: any
  mediaUrl: string | null
  activeTurnIndex: number
  replayMode: boolean
  onToggleReplay: () => void
  onSeekTo: (t: number) => void
  speakerStats: { speaker: string }[]
  speakerName: (raw: string) => string
  onRenameClick: (speaker: string) => void
}

const KEY_WORDS = ['decided', 'decision', 'will', 'deadline', 'action', 'agreed', 'agree', 'important', 'conclusion', 'need to', 'must', 'approve', 'approved']

export function TranscriptTab({ transcript, mediaUrl, activeTurnIndex, replayMode, onToggleReplay, onSeekTo, speakerStats, speakerName, onRenameClick }: TranscriptTabProps) {
  const [txSearch, setTxSearch]   = useState('')
  const [txSpeaker, setTxSpeaker] = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<number | null>(null)

  const turns: any[] = transcript?.speaker_turns ?? []

  const uniqueSpeakers = useMemo(() => [...new Set(turns.map((t) => t.speaker as string))], [turns])

  const keyMoments = useMemo(() =>
    turns.filter((t) => {
      const text = (t.text ?? '').toLowerCase()
      return t.text?.includes('?') || KEY_WORDS.some(k => text.includes(k))
    }).slice(0, 7)
  , [turns])

  const filteredTurns = useMemo(() =>
    turns.filter((t) => {
      const matchSearch  = !txSearch  || (t.text ?? '').toLowerCase().includes(txSearch.toLowerCase())
      const matchSpeaker = !txSpeaker || t.speaker === txSpeaker
      return matchSearch && matchSpeaker
    })
  , [turns, txSearch, txSpeaker])

  if (!transcript) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', borderRadius: 16, background: C.card, border: `1px solid ${C.border}` }}>
        <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: C.card, border: `1px solid ${C.border}` }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.text3, pointerEvents: 'none' }} />
            <input
              id="tx-search" type="text" value={txSearch} onChange={(e) => setTxSearch(e.target.value)}
              placeholder="Search transcript… (press /)"
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: 12, color: C.text1, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
            {txSearch && (
              <button onClick={() => setTxSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text3, display: 'flex', padding: 2 }}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>
          {mediaUrl && (
            <button onClick={onToggleReplay} style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 7, padding: '6px 11px', fontSize: 11, fontWeight: 600, border: `1px solid ${replayMode ? 'rgba(99,102,241,0.5)' : C.border}`, background: replayMode ? 'rgba(99,102,241,0.12)' : 'transparent', color: replayMode ? C.accentHi : C.text3, cursor: 'pointer', flexShrink: 0 }}>
              <Zap style={{ width: 11, height: 11 }} />Replay
            </button>
          )}
        </div>

        {uniqueSpeakers.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter</span>
            {uniqueSpeakers.map((spk, si) => {
              const col = SPEAKER_COLORS[si % SPEAKER_COLORS.length]
              const active = txSpeaker === spk
              return (
                <button key={spk} onClick={() => setTxSpeaker(active ? null : spk)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, border: `1px solid ${active ? col.bar : 'rgba(255,255,255,0.1)'}`, background: active ? col.bg : 'transparent', color: active ? col.text : C.text3, cursor: 'pointer' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.bar, flexShrink: 0 }} />
                  {speakerName(spk)}
                </button>
              )
            })}
            {(txSearch || txSpeaker) && <span style={{ fontSize: 11, color: C.text3 }}>{filteredTurns.length} result{filteredTurns.length !== 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>

      {/* Key moments */}
      {keyMoments.length > 0 && !txSearch && !txSpeaker && (
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(99,102,241,0.03)' }}>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(99,102,241,0.55)', margin: '0 0 8px' }}>⚡ Key Moments</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {keyMoments.map((km: any, ki: number) => (
              <button key={ki} onClick={() => { if (mediaUrl) onSeekTo(km.start) }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.06)', color: C.text2, cursor: 'pointer', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)' }}
                title={km.text}
              >
                <span style={{ fontSize: 9, color: C.text3, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {Math.floor(km.start / 60)}:{String(Math.floor(km.start % 60)).padStart(2, '0')}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{km.text?.slice(0, 40)}{(km.text?.length ?? 0) > 40 ? '…' : ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lines */}
      {filteredTurns.length === 0
        ? <div style={{ padding: '40px 20px', textAlign: 'center', color: C.text3, fontSize: 13 }}>No results for &ldquo;{txSearch}&rdquo;</div>
        : filteredTurns.map((line: any, fi: number) => {
            const origIdx   = turns.findIndex((t) => t === line)
            const spkIdx    = speakerStats.findIndex(s => s.speaker === line.speaker)
            const color     = SPEAKER_COLORS[spkIdx % SPEAKER_COLORS.length]
            const isActive  = origIdx === activeTurnIndex
            const isKm      = keyMoments.some((km: any) => km.start === line.start)

            const renderText = () => {
              if (!txSearch) return line.text
              const parts = (line.text ?? '').split(new RegExp(`(${txSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
              return parts.map((part: string, pi: number) =>
                part.toLowerCase() === txSearch.toLowerCase()
                  ? <mark key={pi} style={{ background: 'rgba(99,102,241,0.3)', color: '#fff', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
                  : part
              )
            }

            return (
              <div
                id={`tx-turn-${origIdx}`} key={fi}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', transition: 'background 0.1s', borderBottom: fi < filteredTurns.length - 1 ? `1px solid ${C.border}` : 'none', background: isActive ? color.bg : 'transparent', cursor: mediaUrl ? 'pointer' : 'default', borderLeft: isKm ? '2px solid rgba(99,102,241,0.4)' : '2px solid transparent' }}
                onClick={() => mediaUrl && onSeekTo(line.start)}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = C.surface }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? color.bg : 'transparent' }}
              >
                <span style={{ marginTop: 1, width: 42, flexShrink: 0, fontSize: 11, fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: C.text3 }}>
                  {Math.floor(line.start / 60)}:{String(Math.floor(line.start % 60)).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ marginBottom: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: isActive ? color.text : C.accentHi }}>
                    <span title="Click to rename" onClick={(e) => { e.stopPropagation(); onRenameClick(line.speaker) }} style={{ cursor: 'pointer', borderBottom: '1px dashed currentColor', paddingBottom: 1 }}>
                      {speakerName(line.speaker)}
                    </span>
                    {isActive && <span style={{ marginLeft: 8, fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: color.text }}>● speaking</span>}
                    {isKm && !isActive && <span style={{ marginLeft: 8, fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'rgba(99,102,241,0.55)', fontSize: 9 }}>★ key moment</span>}
                  </p>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: C.text2, margin: 0, display: expanded === origIdx ? undefined : '-webkit-box', WebkitLineClamp: expanded === origIdx ? undefined : 3, WebkitBoxOrient: expanded === origIdx ? undefined : 'vertical' as any, overflow: expanded === origIdx ? undefined : 'hidden' }}>
                    {renderText()}
                  </p>
                </div>
                <ChevronDown
                  style={{ marginTop: 2, width: 14, height: 14, flexShrink: 0, color: C.text3, transition: 'transform 0.15s', transform: expanded === origIdx ? 'rotate(180deg)' : undefined }}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExpanded(expanded === origIdx ? null : origIdx) }}
                />
              </div>
            )
          })
      }
    </div>
  )
}
