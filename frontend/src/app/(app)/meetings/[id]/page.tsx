'use client'

import { useState, useEffect, useRef, useMemo, use, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft, Clock, Users, Globe, CheckSquare, MessageSquare,
  Loader2, AlertCircle, Sparkles, Music, Play, Pause,
  Download, Copy, BarChart2, ChevronDown, Video, Check,
  SkipBack, SkipForward, Volume2, FileText, CalendarPlus, Hash,
  Search, Image, Zap, X,
} from 'lucide-react'
import { useMeeting, useTranscript, useProtocol } from '@/hooks/use-meetings'
import { MeetingStatus } from '@/types'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const LANG: Record<string, string> = { mn: 'Mongolian', en: 'English', mixed: 'Mixed' }

const SPEAKER_COLORS = [
  { bg: 'rgba(99,102,241,0.08)',  text: '#818cf8', bar: '#6366f1' },
  { bg: 'rgba(245,158,11,0.08)', text: '#fbbf24', bar: '#f59e0b' },
  { bg: 'rgba(16,185,129,0.08)', text: '#34d399', bar: '#10b981' },
  { bg: 'rgba(239,68,68,0.08)',  text: '#f87171', bar: '#ef4444' },
]

const ACTION_STATUSES = ['todo', 'in-progress', 'done', 'blocked'] as const
const ACTION_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; sym: string }> = {
  'todo':        { label: 'To Do',       color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', sym: '○' },
  'in-progress': { label: 'In Progress', color: '#fbbf24',                bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)', sym: '◑' },
  'done':        { label: 'Done',        color: '#34d399',                bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)', sym: '●' },
  'blocked':     { label: 'Blocked',     color: '#f87171',                bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',  sym: '✕' },
}

/* ── Tooltip ──────────────────────────────────────────────────────── */
function Tip({ text, children, align = 'center', pos = 'above', width = 230, style }: {
  text: string; children: React.ReactNode
  align?: 'center'|'left'|'right'; pos?: 'above'|'below'; width?: number; style?: React.CSSProperties
}) {
  const [show, setShow] = useState(false)
  const hPos: React.CSSProperties = align === 'right' ? { right: 0 } : align === 'left' ? { left: 0 } : { left: '50%', transform: 'translateX(-50%)' }
  const vPos: React.CSSProperties = pos === 'below' ? { top: 'calc(100% + 8px)' } : { bottom: 'calc(100% + 8px)' }
  const arrowH: React.CSSProperties = align === 'right' ? { right: 10 } : align === 'left' ? { left: 10 } : { left: '50%', transform: 'translateX(-50%)' }
  const arrowDir: React.CSSProperties = pos === 'below'
    ? { bottom: '100%', borderBottom: '5px solid #181626', borderTop: 'none' }
    : { top: '100%', borderTop: '5px solid #181626', borderBottom: 'none' }
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position: 'absolute', ...vPos, ...hPos, zIndex: 9999,
          width, background: '#181626', color: 'rgba(255,255,255,0.88)',
          fontSize: 12, lineHeight: 1.6, padding: '9px 12px', borderRadius: 9,
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          pointerEvents: 'none', whiteSpace: 'normal',
        }}>
          {text}
          <span style={{
            position: 'absolute', ...arrowH,
            width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            ...arrowDir,
          }} />
        </span>
      )}
    </span>
  )
}

function canvasRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const C = {
  card:    '#12121c',
  border:  'rgba(255,255,255,0.06)',
  surface: 'rgba(255,255,255,0.03)',
  text1:   '#f1f5f9',
  text2:   'rgba(255,255,255,0.65)',
  text3:   'rgba(255,255,255,0.38)',
  accent:  '#6366f1',
  accentHi:'#818cf8',
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function StatusBadge({ status }: { status: MeetingStatus }) {
  const processing = [
    MeetingStatus.QUEUED, MeetingStatus.UPLOADING, MeetingStatus.TRANSCRIBING,
    MeetingStatus.ANALYZING, MeetingStatus.GENERATING_PROTOCOL, MeetingStatus.DIARIZING,
  ].includes(status)

  if (status === MeetingStatus.DONE)
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700,
        background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)',
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
        Completed
      </span>
    )
  if (status === MeetingStatus.FAILED)
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700,
        background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)',
      }}>
        <AlertCircle style={{ width: 11, height: 11 }} />Failed
      </span>
    )
  if (processing)
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700,
        background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)',
      }}>
        <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
        {status.replace(/_/g, ' ')}
      </span>
    )
  return null
}

function NoteArea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(99,102,241,0.55)', margin: '0 0 6px' }}>
        ✏ Notes
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add notes for this section…"
        rows={value ? Math.max(2, (value.match(/\n/g) || []).length + 2) : 2}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(99,102,241,0.03)',
          border: '1px dashed rgba(99,102,241,0.18)',
          borderRadius: 8, padding: '10px 13px',
          fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.7)',
          resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.15s, background 0.15s',
          minHeight: 52,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.18)'; e.currentTarget.style.background = 'rgba(99,102,241,0.03)' }}
      />
    </div>
  )
}

function DocBlock({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 28, paddingBottom: last ? 0 : 28, borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
      <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(99,102,241,0.7)', margin: '0 0 14px' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

type Tab = 'protocol' | 'transcript' | 'analytics' | 'document'

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tab, setTab] = useState<Tab>('protocol')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [actionStatuses, setActionStatuses] = useState<Record<number, string>>({})
  const [txSearch, setTxSearch] = useState('')
  const [txSpeaker, setTxSpeaker] = useState<string | null>(null)
  const [replayMode, setReplayMode] = useState(false)
  const [speakerNames, setSpeakerNames] = useState<Record<string,string>>(() => {
    try { return JSON.parse(localStorage.getItem(`mira-speakers-${id}`) ?? '{}') } catch { return {} }
  })
  const [renamingSpk, setRenamingSpk] = useState<string | null>(null)
  const [renameInput, setRenameInput] = useState('')

  const sn = (raw: string) => {
    if (speakerNames[raw]) return speakerNames[raw]
    const m = raw.match(/^SPEAKER_?0*(\d+)$/i)
    if (m) return `Speaker ${parseInt(m[1], 10) + 1}`
    return raw
  }
  function doRename() {
    if (!renamingSpk) return
    const updated = renameInput.trim()
      ? { ...speakerNames, [renamingSpk]: renameInput.trim() }
      : Object.fromEntries(Object.entries(speakerNames).filter(([k]) => k !== renamingSpk))
    setSpeakerNames(updated)
    try { localStorage.setItem(`mira-speakers-${id}`, JSON.stringify(updated)) } catch {}
    setRenamingSpk(null)
  }

  const { data: meeting, isLoading: meetingLoading } = useMeeting(id)
  const isDone = meeting?.status === 'done'
  const { data: protocol } = useProtocol(id, isDone)
  const { data: transcript } = useTranscript(id, isDone)

  // ── Media player ──────────────────────────────────────────────
  const mediaRef = useRef<HTMLVideoElement>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isVideo, setIsVideo] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [mediaError, setMediaError] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!isDone) return
    let url = ''
    api.get(`/meetings/${id}/media`, { responseType: 'blob', timeout: 60000 })
      .then(r => {
        setIsVideo(r.data.type?.startsWith('video/'))
        url = URL.createObjectURL(r.data)
        setMediaUrl(url)
      })
      .catch(() => setMediaError(true))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [isDone, id])

  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    const onTime  = () => setCurrentTime(el.currentTime)
    const onPlay  = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onMeta  = () => setDuration(el.duration)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('loadedmetadata', onMeta)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('loadedmetadata', onMeta)
    }
  }, [mediaUrl])

  const activeTurnIndex = useMemo(() => {
    if (!transcript?.speaker_turns) return -1
    return (transcript.speaker_turns as any[]).findIndex(
      (t) => currentTime >= t.start && currentTime <= t.end
    )
  }, [currentTime, transcript])

  const seekTo = useCallback((time: number) => {
    if (mediaRef.current) { mediaRef.current.currentTime = time; mediaRef.current.play() }
  }, [])

  const togglePlay = useCallback(() => {
    const el = mediaRef.current
    if (!el) return
    isPlaying ? el.pause() : el.play()
  }, [isPlaying])

  const skip = useCallback((delta: number) => {
    if (mediaRef.current) mediaRef.current.currentTime += delta
  }, [])

  const setPlaybackSpeed = useCallback((s: number) => {
    setSpeed(s)
    if (mediaRef.current) mediaRef.current.playbackRate = s
  }, [])

  // Replay mode: auto-scroll transcript to the currently-spoken line
  useEffect(() => {
    if (!replayMode || activeTurnIndex < 0 || tab !== 'transcript') return
    document.getElementById(`tx-turn-${activeTurnIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeTurnIndex, replayMode, tab])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); setTab('protocol') }
      else if (e.key === 't' || e.key === 'T') { e.preventDefault(); setTab('transcript') }
      else if (e.key === 'a' || e.key === 'A') { e.preventDefault(); setTab('analytics') }
      else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); setTab('document') }
      else if (e.key === ' ' && mediaUrl) { e.preventDefault(); togglePlay() }
      else if (e.key === '/' && tab === 'transcript') { e.preventDefault(); document.getElementById('tx-search')?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tab, mediaUrl, togglePlay])

  // Notes — persisted per meeting in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mira-notes-${id}`)
      if (saved) setNotes(JSON.parse(saved))
      const savedStatuses = localStorage.getItem(`mira-actions-${id}`)
      if (savedStatuses) setActionStatuses(JSON.parse(savedStatuses))
    } catch {}
  }, [id])

  const updateNote = useCallback((key: string, value: string) => {
    setNotes(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(`mira-notes-${id}`, JSON.stringify(next)) } catch {}
      return next
    })
  }, [id])

  const updateActionStatus = useCallback((idx: number) => {
    setActionStatuses(prev => {
      const current = (prev[idx] ?? 'todo') as string
      const ci = ACTION_STATUSES.indexOf(current as typeof ACTION_STATUSES[number])
      const next = { ...prev, [idx]: ACTION_STATUSES[(ci + 1) % ACTION_STATUSES.length] }
      try { localStorage.setItem(`mira-actions-${id}`, JSON.stringify(next)) } catch {}
      return next
    })
  }, [id])

  // ── Speaker analytics ──────────────────────────────────────────
  const speakerStats = useMemo(() => {
    if (!transcript?.speaker_turns?.length) return []
    const stats: Record<string, { words: number; seconds: number; color: typeof SPEAKER_COLORS[0] }> = {}
    let colorIdx = 0
    for (const turn of transcript.speaker_turns as any[]) {
      if (!stats[turn.speaker]) {
        stats[turn.speaker] = { words: 0, seconds: 0, color: SPEAKER_COLORS[colorIdx++ % SPEAKER_COLORS.length] }
      }
      stats[turn.speaker].words += turn.text?.split(/\s+/).length ?? 0
      stats[turn.speaker].seconds += Math.max(0, turn.end - turn.start)
    }
    const total = Object.values(stats).reduce((s, v) => s + v.seconds, 0)
    return Object.entries(stats)
      .map(([speaker, { words, seconds, color }]) => ({
        speaker, words, seconds, color,
        pct: total > 0 ? Math.round(seconds / total * 100) : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds)
  }, [transcript])

  const meetingScore = useMemo(() => {
    if (!protocol) return null
    const decisions = protocol.key_decisions?.length ?? 0
    const actions = protocol.action_items?.length ?? 0
    const hasNextMeeting = protocol.next_meeting ? 1 : 0
    const openQ = protocol.open_questions?.length ?? 0
    let score = 0
    score += Math.min(decisions * 2, 4)
    score += Math.min(actions, 3)
    score += 1
    score += hasNextMeeting
    score += openQ === 0 ? 1 : 0
    return Math.min(score, 10)
  }, [protocol])

  const sentiment = useMemo(() => {
    if (!protocol) return null
    const decisions = protocol.key_decisions?.length ?? 0
    const openQ = protocol.open_questions?.length ?? 0
    const hasNext = !!protocol.next_meeting?.proposed_date
    const s = decisions * 2 - openQ + (hasNext ? 1 : 0)
    const label = s >= 5 ? 'Highly Productive' : s >= 3 ? 'Productive' : s >= 1 ? 'Mixed Results' : 'Needs Follow-up'
    const emoji = s >= 5 ? '🎯' : s >= 3 ? '✅' : s >= 1 ? '🔀' : '⚠️'
    const color = s >= 5 ? '#34d399' : s >= 3 ? '#818cf8' : s >= 1 ? '#fbbf24' : '#f87171'
    const desc = s >= 5
      ? `Strong meeting — ${decisions} decision${decisions !== 1 ? 's' : ''} made and all questions resolved.`
      : s >= 3
      ? `${decisions} decision${decisions !== 1 ? 's' : ''} reached${openQ > 0 ? `, ${openQ} question${openQ !== 1 ? 's' : ''} remain open` : ''}.`
      : s >= 1
      ? `Progress made but ${openQ} question${openQ !== 1 ? 's' : ''} remain unresolved.`
      : `${openQ} open question${openQ !== 1 ? 's' : ''} without clear resolution — consider a follow-up.`
    return { label, emoji, color, desc, decisions, openQ }
  }, [protocol])

  const agendaCompletion = useMemo(() => {
    if (!protocol?.agenda_items?.length) return null
    const items = protocol.agenda_items as any[]
    const decisions = (protocol.key_decisions ?? []) as any[]
    const openQs = (protocol.open_questions ?? []) as any[]
    const statuses = items.map((item: any) => {
      const words = (item.title ?? '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
      if (decisions.some((d: any) => words.some((w: string) => (d.decision ?? '').toLowerCase().includes(w)))) return 'resolved' as const
      if (openQs.some((q: any) => words.some((w: string) => (q.question ?? '').toLowerCase().includes(w)))) return 'open' as const
      return 'discussed' as const
    })
    const resolved = statuses.filter(s => s === 'resolved').length
    return { items, statuses, resolved, pct: Math.round(resolved / items.length * 100) }
  }, [protocol])

  const keyMoments = useMemo(() => {
    if (!transcript?.speaker_turns) return []
    const kws = ['decided', 'decision', 'will', 'deadline', 'action', 'agreed', 'agree', 'important', 'conclusion', 'need to', 'must', 'approve', 'approved']
    return (transcript.speaker_turns as any[]).filter((t: any) => {
      const text = (t.text ?? '').toLowerCase()
      return t.text?.includes('?') || kws.some(k => text.includes(k))
    }).slice(0, 7)
  }, [transcript])

  const uniqueSpeakers = useMemo(() => {
    if (!transcript?.speaker_turns) return [] as string[]
    return [...new Set((transcript.speaker_turns as any[]).map((t: any) => t.speaker as string))]
  }, [transcript])

  const filteredTurns = useMemo(() => {
    if (!transcript?.speaker_turns) return []
    return (transcript.speaker_turns as any[]).filter((t: any) => {
      const matchSearch = !txSearch || (t.text ?? '').toLowerCase().includes(txSearch.toLowerCase())
      const matchSpeaker = !txSpeaker || t.speaker === txSpeaker
      return matchSearch && matchSpeaker
    })
  }, [transcript, txSearch, txSpeaker])

  // ── Exports ────────────────────────────────────────────────────
  function generateSummaryCard() {
    if (!protocol || !meeting) return
    const canvas = document.createElement('canvas')
    const W = 1200, H = 630
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#0a0a18'); bg.addColorStop(1, '#12101e')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

    // Ambient glow top-right
    const glow = ctx.createRadialGradient(W * 0.82, H * 0.28, 0, W * 0.82, H * 0.28, 380)
    glow.addColorStop(0, 'rgba(99,102,241,0.18)'); glow.addColorStop(1, 'rgba(99,102,241,0)')
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)

    // Top accent border
    const accentGrad = ctx.createLinearGradient(0, 0, W, 0)
    accentGrad.addColorStop(0, '#6366f1'); accentGrad.addColorStop(0.5, '#818cf8'); accentGrad.addColorStop(1, 'rgba(99,102,241,0.2)')
    ctx.fillStyle = accentGrad; ctx.fillRect(0, 0, W, 5)

    // Brand
    ctx.font = '700 11px -apple-system, Helvetica, Arial, sans-serif'
    ctx.fillStyle = 'rgba(99,102,241,0.65)'
    ctx.fillText('MIRA · MEETING PROTOCOL', 64, 54)

    // Title
    ctx.font = '800 38px -apple-system, Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#f1f5f9'
    const title = meeting.title.length > 54 ? meeting.title.slice(0, 54) + '…' : meeting.title
    ctx.fillText(title, 64, 112)

    // Date + language
    ctx.font = '400 15px -apple-system, Helvetica, Arial, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.42)'
    ctx.fillText(format(new Date(meeting.meeting_date), 'MMMM d, yyyy') + (meeting.language ? `  ·  ${LANG[meeting.language] ?? meeting.language}` : ''), 64, 145)

    // Score ring (right side)
    const RX = 990, RY = 195, R = 68
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 9
    ctx.beginPath(); ctx.arc(RX, RY, R, 0, Math.PI * 2); ctx.stroke()
    const arc = (meetingScore ?? 0) / 10 * Math.PI * 2
    const rGrad = ctx.createLinearGradient(RX - R, RY, RX + R, RY)
    rGrad.addColorStop(0, '#6366f1'); rGrad.addColorStop(1, '#818cf8')
    ctx.strokeStyle = rGrad; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.arc(RX, RY, R, -Math.PI / 2, -Math.PI / 2 + arc); ctx.stroke()
    ctx.font = '800 30px -apple-system'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
    ctx.fillText(`${meetingScore ?? 0}`, RX, RY + 10)
    ctx.font = '400 12px -apple-system'; ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.fillText('/10  SCORE', RX, RY + 32); ctx.textAlign = 'left'

    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(64, 170, W - 128, 1)

    // Metrics row
    const metrics = [
      { label: 'Decisions', value: String(protocol.key_decisions?.length ?? 0), color: '#818cf8' },
      { label: 'Actions',   value: String(protocol.action_items?.length ?? 0),   color: '#34d399' },
      { label: 'Questions', value: String(protocol.open_questions?.length ?? 0),  color: '#fbbf24' },
      { label: 'Speakers',  value: String(speakerStats.length || (transcript?.speaker_count ?? 0)), color: '#60a5fa' },
    ]
    metrics.forEach(({ label, value, color }, i) => {
      const x = 64 + i * 160
      // Card bg
      ctx.fillStyle = 'rgba(255,255,255,0.03)'
      canvasRoundRect(ctx, x - 8, 185, 140, 62, 8); ctx.fill()
      ctx.font = '800 26px -apple-system'; ctx.fillStyle = color
      ctx.fillText(value, x, 225)
      ctx.font = '400 11px -apple-system'; ctx.fillStyle = 'rgba(255,255,255,0.38)'
      ctx.fillText(label, x, 243)
    })

    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(64, 264, W - 128, 1)

    // Key decisions
    const decisions = protocol.key_decisions ?? []
    if (decisions.length > 0) {
      ctx.font = '700 9px -apple-system'; ctx.fillStyle = 'rgba(99,102,241,0.55)'
      ctx.fillText('KEY DECISIONS', 64, 293)
      decisions.slice(0, 4).forEach((d: any, i: number) => {
        const y = 315 + i * 58
        ctx.fillStyle = 'rgba(255,255,255,0.025)'; canvasRoundRect(ctx, 64, y - 16, W - 128, 48, 7); ctx.fill()
        ctx.fillStyle = 'rgba(99,102,241,0.18)'; canvasRoundRect(ctx, 78, y - 7, 22, 22, 5); ctx.fill()
        ctx.font = '700 10px -apple-system'; ctx.fillStyle = '#818cf8'; ctx.textAlign = 'center'
        ctx.fillText(String(i + 1), 89, y + 7); ctx.textAlign = 'left'
        ctx.font = '400 13px -apple-system'; ctx.fillStyle = 'rgba(255,255,255,0.65)'
        const text = (d.decision ?? String(d)).slice(0, 100)
        ctx.fillText(text + (((d.decision ?? String(d)).length > 100) ? '…' : ''), 114, y + 7)
      })
    }

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, H - 52, W, 1)
    ctx.font = '400 11px -apple-system'; ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fillText(`Generated by Mira · ${format(new Date(), 'MMMM d, yyyy')}`, 64, H - 18)
    ctx.font = '700 11px -apple-system'; ctx.fillStyle = 'rgba(99,102,241,0.55)'
    ctx.textAlign = 'right'; ctx.fillText('MIRA.AI', W - 64, H - 18)

    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 48)}-mira.png`
    a.click()
    toast.success('Summary card exported as PNG')
  }

  function exportPDF() {
    if (!protocol || !meeting) return
    const win = window.open('', '_blank')
    if (!win) return

    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

    const dateStr = format(new Date(meeting.meeting_date), 'yyyy.MM.dd')
    const participants: string[] = meeting.participants ?? []
    const chair = participants[0] ?? ''
    const secretary = participants.length > 1 ? participants[participants.length - 1] : ''
    const refNum = `No. ${String(new Date(meeting.meeting_date).getMonth() + 1).padStart(2,'0')}`
    const lang = meeting.language ? (LANG[meeting.language] ?? meeting.language) : ''

    // Opening paragraph — narrative style like the template
    const attendancePct = participants.length > 0 ? `${participants.length} participant${participants.length !== 1 ? 's' : ''} present.` : ''
    const openPara1 = `The meeting was held at ${dateStr}${meeting.duration_seconds ? `, lasting ${formatTime(meeting.duration_seconds)}` : ''}. ${attendancePct}`
    const openPara2 = chair ? `The meeting was opened and chaired by ${esc(chair)}. ${participants.length > 1 ? `Participants: ${esc(participants.join(', '))}.` : ''}` : ''
    const summaryPara = protocol.summary ? esc(protocol.summary) : ''

    // Agenda items — each as bold "AGENDA ITEM N: Title" inline heading + body
    const agendaItems: any[] = protocol.agenda_items ?? []
    const agendaHTML = agendaItems.map((item: any, i: number) => {
      const desc = item.description ? `<p contenteditable="true" spellcheck="true">${esc(item.description)}</p>` : ''
      return `<p contenteditable="true" spellcheck="true"><strong>AGENDA ITEM ${i + 1}:</strong> ${esc(item.title ?? '')}${item.duration_min ? ` (${item.duration_min} min)` : ''}</p>${desc}<br>`
    }).join('')

    // Key decisions — each as bold resolved statement
    const decisions: any[] = protocol.key_decisions ?? []
    const decisionsHTML = decisions.length > 0 ? `
      <p><strong>Key Decisions</strong></p>
      ${decisions.map((d: any, i: number) =>
        `<p contenteditable="true" spellcheck="true">${i + 1}.&ensp;${esc(d.decision ?? String(d))}</p>`
      ).join('')}<br>` : ''

    // Action items — inline paragraph per item
    const actions: any[] = protocol.action_items ?? []
    const actionsHTML = actions.length > 0 ? `
      <p><strong>Action Items</strong></p>
      ${actions.map((a: any) => {
        const meta = [
          a.owner ? `Responsible: ${esc(a.owner)}` : '',
          a.due_date ? `Due: ${esc(a.due_date)}` : '',
          a.priority ? `Priority: ${a.priority}` : '',
        ].filter(Boolean).join(' · ')
        return `<p contenteditable="true" spellcheck="true">☐&ensp;${esc(a.task)}${meta ? `<br><span style="font-size:.9em;color:#555;padding-left:1.4em">${meta}</span>` : ''}</p>`
      }).join('')}<br>` : ''

    // Open questions
    const questions: any[] = protocol.open_questions ?? []
    const questionsHTML = questions.length > 0 ? `
      <p><strong>Open Questions</strong></p>
      ${questions.map((q: any) =>
        `<p contenteditable="true" spellcheck="true">—&ensp;${esc(q.question ?? String(q))}</p>`
      ).join('')}<br>` : ''

    // Next meeting
    const nextHTML = protocol.next_meeting?.proposed_date ? `
      <p contenteditable="true" spellcheck="true">The next meeting is proposed for <strong>${esc(protocol.next_meeting.proposed_date)}</strong>${protocol.next_meeting.topics?.length ? `. Topics: ${esc(protocol.next_meeting.topics.join(', '))}.` : '.'}</p><br>` : ''

    win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${esc(meeting.title)} — Meeting Minutes</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--f:'Times New Roman',Times,serif;--s:14pt}
body{font-family:var(--f);font-size:var(--s);background:#fff;color:#000;line-height:1.7}

/* toolbar */
#tb{position:fixed;top:0;left:0;right:0;z-index:99;display:flex;align-items:center;gap:8px;padding:7px 18px;background:#f4f4f4;border-bottom:1px solid #ccc;font-family:Arial,sans-serif;flex-wrap:wrap}
#tb label{font-size:11px;font-weight:600;color:#555}
#tb select,#tb input[type=range]{border:1px solid #bbb;border-radius:4px;padding:3px 7px;font-size:11px;background:#fff;cursor:pointer}
.sep{width:1px;height:18px;background:#ccc;flex-shrink:0}
.btn{padding:4px 12px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid #bbb;background:#fff;font-family:Arial,sans-serif}
.btn:hover{background:#e8e8e8}
.pbtn{background:#000;color:#fff;border-color:#000}
.pbtn:hover{background:#333}
#sv{font-size:11px;color:#777;min-width:26px}
.hint{font-size:10px;color:#aaa;margin-left:auto;font-style:italic}

/* page */
.page{max-width:680px;margin:56px auto 60px;padding:80px 90px 100px;background:#fff;box-shadow:0 0 0 1px #ddd,0 4px 24px rgba(0,0,0,0.08)}

/* title block — centered bold, like the template header */
.title{text-align:center;font-weight:bold;line-height:1.45;margin-bottom:20px;font-size:var(--s)}

/* meta row — date | number | location, no border */
.meta{display:flex;justify-content:space-between;margin-bottom:18px;font-size:var(--s)}
.meta span{flex:1;text-align:center}
.meta span:first-child{text-align:left}
.meta span:last-child{text-align:right}

/* body paragraphs */
p{text-indent:2em;text-align:justify;line-height:1.7;margin-bottom:4px}
p.no-i{text-indent:0}
br{display:block;margin-top:6px}

/* resolution — bold centered, like "Олонхын саналаар..." */
p.res{text-align:center;font-weight:bold;text-indent:0;margin:10px 0}

/* signature block */
.sig{margin-top:60px;display:flex;justify-content:flex-end;gap:40px;font-size:var(--s)}
.sig-role{line-height:1.5}
.sig-name{font-weight:normal}

/* editable */
[contenteditable]{outline:none}
[contenteditable]:hover{background:rgba(0,0,200,0.04)}
[contenteditable]:focus{background:rgba(0,0,200,0.06);box-shadow:0 0 0 1px rgba(99,102,241,0.4)}

@media print{
  #tb{display:none}
  .page{margin:0;padding:60px 70px 80px;box-shadow:none}
  [contenteditable]{background:transparent!important;box-shadow:none!important}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style></head><body>

<div id="tb">
  <label>Font</label>
  <select onchange="document.body.style.setProperty('--f',this.value)">
    <option value="'Times New Roman',Times,serif">Times New Roman</option>
    <option value="Georgia,serif">Georgia</option>
    <option value="Arial,Helvetica,sans-serif">Arial</option>
    <option value="'Courier New',monospace">Courier</option>
  </select>
  <div class="sep"></div>
  <label>Size</label>
  <input type="range" min="11" max="16" value="14" step="1"
    oninput="document.body.style.setProperty('--s',this.value+'pt');document.getElementById('sv').textContent=this.value+'pt'">
  <span id="sv">14pt</span>
  <div class="sep"></div>
  <button class="btn" onclick="document.execCommand('bold')"><b>B</b></button>
  <button class="btn" onclick="document.execCommand('italic')"><i>I</i></button>
  <button class="btn" onclick="document.execCommand('underline')"><u>U</u></button>
  <div class="sep"></div>
  <button class="btn pbtn" onclick="window.print()">⬇ Print / Save PDF</button>
  <span class="hint">Click any text to edit</span>
</div>

<div class="page">

  <!-- Title — same structure as the template: org name + "MEETING MINUTES" centered bold -->
  <div class="title" contenteditable="true" spellcheck="true">${esc(meeting.title)}<br>MEETING MINUTES</div>

  <!-- Meta row: date | ref number | language/location -->
  <div class="meta">
    <span contenteditable="true" spellcheck="true">${dateStr}</span>
    <span contenteditable="true" spellcheck="true">${refNum}</span>
    <span contenteditable="true" spellcheck="true">${esc(lang)}</span>
  </div>

  <!-- Opening paragraphs -->
  <p contenteditable="true" spellcheck="true">${openPara1}</p>
  ${openPara2 ? `<p contenteditable="true" spellcheck="true">${openPara2}</p>` : ''}
  ${summaryPara ? `<p contenteditable="true" spellcheck="true">${summaryPara}</p>` : ''}
  <br>

  <!-- Agenda items -->
  ${agendaHTML}

  <!-- Decisions as bold resolved statements -->
  ${decisionsHTML}

  <!-- Action items -->
  ${actionsHTML}

  <!-- Open questions -->
  ${questionsHTML}

  <!-- Next meeting -->
  ${nextHTML}

  <!-- Closing line — like "Хурал 16.20 цагт дууслаа." -->
  <p contenteditable="true" spellcheck="true">The meeting was concluded${meeting.duration_seconds ? ` after ${formatTime(meeting.duration_seconds)}` : ''}.</p>

  <!-- Signature — bottom right, two columns like the template -->
  <div class="sig">
    <div class="sig-role" contenteditable="true" spellcheck="true">Secretary /<br>Recorder</div>
    <div class="sig-name" contenteditable="true" spellcheck="true">${secretary ? esc(secretary) : '______________________'}</div>
  </div>

</div>
<script>
  document.querySelectorAll('[contenteditable]').forEach(el=>{
    el.addEventListener('click',e=>e.stopPropagation())
  })
</script>
</body></html>`)
    win.document.close()
  }

  function copyForSlack() {
    if (!protocol || !meeting) return
    const lines = [
      `*${meeting.title}*`,
      `📅 ${format(new Date(meeting.meeting_date), 'MMMM d, yyyy')}${meeting.language ? `  ·  🌐 ${LANG[meeting.language] ?? meeting.language}` : ''}`,
      '',
    ]
    if (protocol.summary) lines.push(`*Summary*\n${protocol.summary}`, '')
    if (protocol.key_decisions?.length) {
      lines.push('*Key Decisions*')
      protocol.key_decisions.forEach((d: any, i: number) => lines.push(`${i + 1}. ${d.decision ?? d}`))
      lines.push('')
    }
    if (protocol.action_items?.length) {
      lines.push('*Action Items*')
      protocol.action_items.forEach((a: any) =>
        lines.push(`• ☐ ${a.task}${a.owner ? ` _(${a.owner})_` : ''}${a.due_date ? ` — due ${a.due_date}` : ''}${a.priority === 'high' ? ' 🔴' : a.priority === 'medium' ? ' 🟡' : ''}`)
      )
      lines.push('')
    }
    if (protocol.open_questions?.length) {
      lines.push('*Open Questions*')
      protocol.open_questions.forEach((q: any) => lines.push(`• ${q.question ?? q}`))
      lines.push('')
    }
    if (protocol.next_meeting?.proposed_date) lines.push(`*Next Meeting*\n📅 ${protocol.next_meeting.proposed_date}`)
    navigator.clipboard.writeText(lines.join('\n')).then(() => toast.success('Copied for Slack / Notion'))
  }

  function downloadMarkdown() {
    if (!protocol || !meeting) return
    const lines = [
      `# ${meeting.title}`,
      `> ${format(new Date(meeting.meeting_date), 'MMMM d, yyyy')}${meeting.language ? ` · ${LANG[meeting.language] ?? meeting.language}` : ''}`,
      '',
    ]
    if (protocol.summary) lines.push(`## Summary\n\n${protocol.summary}`, '')
    if (protocol.agenda_items?.length) {
      lines.push('## Agenda\n')
      protocol.agenda_items.forEach((it: any) => lines.push(`- ${it.title}${it.duration_min ? ` (${it.duration_min}m)` : ''}`))
      lines.push('')
    }
    if (protocol.key_decisions?.length) {
      lines.push('## Key Decisions\n')
      protocol.key_decisions.forEach((d: any, i: number) => lines.push(`${i + 1}. ${d.decision ?? d}`))
      lines.push('')
    }
    if (protocol.action_items?.length) {
      lines.push('## Action Items\n')
      protocol.action_items.forEach((a: any) =>
        lines.push(`- [ ] **${a.task}**${a.owner ? ` — ${a.owner}` : ''}${a.due_date ? ` · Due: ${a.due_date}` : ''}${a.priority ? ` \`${a.priority}\`` : ''}`)
      )
      lines.push('')
    }
    if (protocol.open_questions?.length) {
      lines.push('## Open Questions\n')
      protocol.open_questions.forEach((q: any) => lines.push(`- ${q.question ?? q}`))
      lines.push('')
    }
    if (protocol.next_meeting) {
      lines.push('## Next Meeting\n')
      if (protocol.next_meeting.proposed_date) lines.push(`📅 ${protocol.next_meeting.proposed_date}`)
      if (protocol.next_meeting.topics?.length) lines.push(`\nTopics: ${protocol.next_meeting.topics.join(', ')}`)
      lines.push('')
    }
    if (Object.values(notes).some(Boolean)) {
      lines.push('---\n\n## Notes\n')
      const noteKeys: Record<string, string> = { header: 'Overall', summary: 'Summary', agenda: 'Agenda', decisions: 'Decisions', actions: 'Actions', questions: 'Questions', nextMeeting: 'Next Meeting' }
      Object.entries(notes).forEach(([k, v]) => { if (v) lines.push(`**${noteKeys[k] ?? k}:** ${v}`, '') })
    }
    lines.push(`---\n\n_Generated by Mira · ${new Date().toLocaleDateString()}_`)
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/-+/g, '-')}-protocol.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown downloaded')
  }

  function downloadIcal() {
    if (!protocol?.next_meeting?.proposed_date || !meeting) return
    const raw = protocol.next_meeting.proposed_date
    const start = new Date(raw)
    if (isNaN(start.getTime())) { toast.error('Could not parse next meeting date'); return }
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
    const topics = protocol.next_meeting.topics?.length ? `\\nTopics: ${protocol.next_meeting.topics.join(', ')}` : ''
    const ical = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mira//Protocol//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:Follow-up: ${meeting.title}`,
      `DESCRIPTION:Scheduled via Mira from "${meeting.title}"${topics}`,
      `UID:mira-${id}-next@mira.ai`,
      `DTSTAMP:${fmt(new Date())}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ical], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'next-meeting.ics'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Calendar event downloaded')
  }

  function copyProtocol() {
    if (!protocol || !meeting) return
    const lines: string[] = [
      `# ${meeting.title}`,
      `${format(new Date(meeting.meeting_date), 'MMMM d, yyyy')}${meeting.participants?.length ? ' · ' + meeting.participants.join(', ') : ''}`,
      '',
    ]
    if (protocol.summary) lines.push(`## Summary\n${protocol.summary}`, '')
    if (protocol.key_decisions?.length) {
      lines.push('## Key Decisions')
      protocol.key_decisions.forEach((d: any, i: number) => lines.push(`${i + 1}. ${d.decision ?? d}`))
      lines.push('')
    }
    if (protocol.action_items?.length) {
      lines.push('## Action Items')
      protocol.action_items.forEach((a: any) => lines.push(`- [ ] ${a.task}${a.owner ? ` (${a.owner})` : ''}${a.due_date ? ` — Due ${a.due_date}` : ''} [${a.priority ?? 'medium'}]`))
      lines.push('')
    }
    if (protocol.open_questions?.length) {
      lines.push('## Open Questions')
      protocol.open_questions.forEach((q: any) => lines.push(`- ${q.question ?? q}`))
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      toast.success('Protocol copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (meetingLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div style={{ display: 'flex', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <AlertCircle style={{ width: 32, height: 32, color: C.text3 }} />
        <p style={{ fontSize: 14, color: C.text2 }}>Meeting not found</p>
        <Link href="/meetings" style={{ fontSize: 13, fontWeight: 600, color: C.accentHi, textDecoration: 'none' }}>← Back</Link>
      </div>
    )
  }

  const isProcessing = ![MeetingStatus.DONE, MeetingStatus.FAILED].includes(meeting.status)

  return (
    <div style={{ minHeight: '100%' }}>

      {/* Sticky breadcrumb */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 32px',
        background: '#0d0d14',
        borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <Link
          href="/meetings"
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.text3, textDecoration: 'none', transition: 'color 0.1s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.text2)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.text3)}
        >
          <ArrowLeft style={{ width: 13, height: 13 }} />Recordings
        </Link>
        <span style={{ color: C.border }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meeting.title}
        </span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── HERO HEADER ─────────────────────────────── */}
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'linear-gradient(155deg, #0e0e1d 0%, #11101e 60%, #0d0d18 100%)',
          border: `1px solid ${C.border}`, position: 'relative',
        }}>
          {/* Ambient glow */}
          <div style={{ position: 'absolute', top: -70, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.09)', filter: 'blur(55px)', pointerEvents: 'none' }} />
          {/* Top accent stripe */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 55%, rgba(99,102,241,0.12) 100%)' }} />

          <div style={{ padding: '22px 28px', position: 'relative' }}>
            {/* Row 1: type icon + status + keyboard hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 9,
                background: isVideo ? 'rgba(14,165,233,0.12)' : 'rgba(99,102,241,0.12)',
                border: `1px solid ${isVideo ? 'rgba(14,165,233,0.2)' : 'rgba(99,102,241,0.2)'}`,
              }}>
                {isVideo
                  ? <Video style={{ width: 16, height: 16, color: '#38bdf8' }} />
                  : <Music style={{ width: 16, height: 16, color: C.accentHi }} />}
              </div>
              <StatusBadge status={meeting.status} />
            </div>

            {/* Row 2: title + score ring */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: C.text1, margin: '0 0 10px', lineHeight: 1.25 }}>
                  {meeting.title}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                  {[
                    { icon: Clock, text: format(new Date(meeting.meeting_date), 'MMMM d, yyyy') },
                    meeting.duration_seconds ? { icon: Clock, text: formatTime(meeting.duration_seconds) } : null,
                    meeting.language ? { icon: Globe, text: LANG[meeting.language] ?? meeting.language } : null,
                    meeting.participants?.length > 0 ? { icon: Users, text: meeting.participants.join(', ') } : null,
                  ].filter(Boolean).map((item: any, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.text2 }}>
                      <item.icon style={{ width: 13, height: 13, color: 'rgba(99,102,241,0.55)' }} />
                      {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: quick metric chips */}
            {isDone && protocol && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                {[
                  { label: 'Decisions', value: protocol?.key_decisions?.length ?? 0, color: C.accentHi },
                  { label: 'Actions',   value: protocol?.action_items?.length ?? 0,   color: '#34d399' },
                  { label: 'Questions', value: protocol?.open_questions?.length ?? 0,  color: '#fbbf24' },
                  { label: 'Speakers',  value: speakerStats.length || (transcript?.speaker_count ?? 0), color: '#60a5fa' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color, margin: 0, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                    <p style={{ fontSize: 10, color: C.text3, margin: '3px 0 0', fontWeight: 500 }}>{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Row 4: export buttons */}
            {isDone && (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Export</span>
                {protocol?.next_meeting?.proposed_date && (
                  <Tip text="Downloads an iCal (.ics) event for the next scheduled meeting so you can add it straight to your calendar.">
                    <button onClick={downloadIcal}
                      style={{ display:'flex', alignItems:'center', gap:5, borderRadius:7, padding:'5px 10px', fontSize:12, fontWeight:600, background:C.surface, border:`1px solid ${C.border}`, color:'#34d399', cursor:'pointer', transition:'all 0.15s' }}
                      onMouseEnter={(e)=>{e.currentTarget.style.borderColor='rgba(16,185,129,0.4)';e.currentTarget.style.background='rgba(16,185,129,0.06)'}}
                      onMouseLeave={(e)=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surface}}>
                      <CalendarPlus style={{width:11,height:11}}/>iCal
                    </button>
                  </Tip>
                )}
                <Tip text="Copies the full protocol as plain text to your clipboard. Good for pasting into emails or any app.">
                  <button onClick={copyProtocol}
                    style={{ display:'flex', alignItems:'center', gap:5, borderRadius:7, padding:'5px 10px', fontSize:12, fontWeight:600, background:C.surface, border:`1px solid ${C.border}`, color:C.text2, cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={(e)=>{e.currentTarget.style.borderColor='rgba(99,102,241,0.35)';e.currentTarget.style.color=C.accentHi}}
                    onMouseLeave={(e)=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2}}>
                    {copied?<Check style={{width:11,height:11}}/>:<Copy style={{width:11,height:11}}/>}
                    {copied?'Copied!':'Copy'}
                  </button>
                </Tip>
                <Tip align="right" text="Opens the meeting protocol as a human-readable document in a new tab. You can edit every section, change fonts, and print or save as PDF.">
                  <button onClick={exportPDF}
                    style={{ display:'flex', alignItems:'center', gap:5, borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:600, background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', cursor:'pointer', border:'none', boxShadow:'0 3px 10px rgba(99,102,241,0.3)', transition:'all 0.15s', marginLeft: 'auto' }}
                    onMouseEnter={(e)=>{e.currentTarget.style.boxShadow='0 5px 18px rgba(99,102,241,0.5)';e.currentTarget.style.transform='translateY(-1px)'}}
                    onMouseLeave={(e)=>{e.currentTarget.style.boxShadow='0 3px 10px rgba(99,102,241,0.3)';e.currentTarget.style.transform=''}}>
                    <Download style={{width:11,height:11}}/>PDF
                  </button>
                </Tip>
              </div>
            )}
          </div>
        </div>

        {/* Media player */}
        {isDone && !mediaError && (
          <div style={{ borderRadius: 16, overflow: 'hidden', background: C.card, border: `1px solid ${C.border}` }}>
            {isVideo ? (
              <video ref={mediaRef as any} src={mediaUrl ?? undefined} style={{ width: '100%', maxHeight: 280, background: '#000', display: 'block' }} controls={false} preload="metadata" />
            ) : (
              <audio ref={mediaRef} src={mediaUrl ?? undefined} preload="metadata" />
            )}

            <div style={{ padding: '16px 20px' }}>
              {/* Progress bar */}
              <div
                style={{ marginBottom: 12, position: 'relative', height: 6, cursor: 'pointer', borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  seekTo(((e.clientX - rect.left) / rect.width) * duration)
                }}
              >
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  transition: 'width 0.1s linear',
                }} />
                {/* Speaker segments on hover */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden', borderRadius: 3, opacity: 0.4, pointerEvents: 'none' }}>
                  {(transcript?.speaker_turns as any[] ?? []).map((t, i) => {
                    const idx = speakerStats.findIndex(s => s.speaker === t.speaker)
                    const color = SPEAKER_COLORS[idx % SPEAKER_COLORS.length]
                    return (
                      <div key={i} style={{
                        position: 'absolute', height: '100%',
                        left: `${(t.start / duration) * 100}%`,
                        width: `${((t.end - t.start) / duration) * 100}%`,
                        background: color.bar,
                      }} />
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => skip(-10)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', color: C.text3, transition: 'color 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.accentHi)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.text3)}>
                    <SkipBack style={{ width: 14, height: 14 }} />
                  </button>

                  <button onClick={togglePlay} disabled={!mediaUrl} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                    border: 'none', cursor: 'pointer', color: '#fff',
                  }}>
                    {!mediaUrl
                      ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                      : isPlaying
                      ? <Pause style={{ width: 15, height: 15 }} />
                      : <Play style={{ width: 15, height: 15, marginLeft: 2 }} />}
                  </button>

                  <button onClick={() => skip(10)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', color: C.text3, transition: 'color 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.accentHi)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.text3)}>
                    <SkipForward style={{ width: 14, height: 14 }} />
                  </button>

                  <span style={{ fontSize: 12, color: C.text3, fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
                    {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Volume2 style={{ width: 13, height: 13, color: C.text3, marginRight: 4 }} />
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button key={s} onClick={() => setPlaybackSpeed(s)} style={{
                      padding: '3px 7px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                      border: 'none', cursor: 'pointer', transition: 'all 0.1s',
                      background: speed === s ? 'rgba(99,102,241,0.2)' : 'transparent',
                      color: speed === s ? C.accentHi : C.text3,
                    }}>
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing banner */}
        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 12, padding: '14px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <Loader2 style={{ width: 16, height: 16, color: '#fbbf24', flexShrink: 0 }} className="animate-spin" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', margin: 0 }}>Mira is processing this recording</p>
              <p style={{ fontSize: 12, color: 'rgba(245,158,11,0.65)', margin: '3px 0 0' }}>Usually takes under a minute · auto-updates</p>
            </div>
          </div>
        )}

        {meeting.status === MeetingStatus.FAILED && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 12, padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <AlertCircle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#f87171', margin: 0 }}>Processing failed</p>
              <p style={{ fontSize: 12, color: 'rgba(239,68,68,0.65)', margin: '3px 0 0' }}>{meeting.error_message ?? 'An unknown error occurred.'}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        {meeting.status === MeetingStatus.DONE && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderRadius: 12, padding: 4, background: C.card, border: `1px solid ${C.border}` }}>
              {([
                { id: 'protocol',   label: 'Protocol',   icon: CheckSquare,  hint: 'Summary, decisions, action items, and open questions from the meeting.' },
                { id: 'transcript', label: 'Transcript', icon: MessageSquare, hint: 'Full word-for-word transcript with speaker labels. Search, filter by speaker, or sync with playback.' },
                { id: 'analytics',  label: 'Analytics',  icon: BarChart2,     hint: 'Talk time per speaker, meeting score breakdown, and participation stats.' },
                { id: 'document',   label: 'Document',   icon: FileText,      hint: 'Edit and annotate the protocol with your own notes section by section.' },
              ] as { id: Tab; label: string; icon: any; hint: string }[]).map(({ id: t, label, icon: Icon, hint }) => (
                <Tip key={t} pos="below" text={hint} style={{ flex: 1, display: 'flex' }}>
                  <button onClick={() => setTab(t)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: tab === t ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                    color: tab === t ? '#fff' : C.text3,
                    boxShadow: tab === t ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
                  }}>
                    <Icon style={{ width: 13, height: 13 }} />{label}
                  </button>
                </Tip>
              ))}
            </div>

            {/* ── PROTOCOL TAB ─────────────────────────────── */}
            {/* Urgency radar */}
            {tab === 'protocol' && protocol && (() => {
              const urgent = (protocol.action_items ?? []).filter((a: any) => {
                if (!a.due_date) return false
                const d = new Date(a.due_date)
                const diff = (d.getTime() - Date.now()) / 86400000
                return diff >= 0 && diff <= 7
              })
              if (!urgent.length) return null
              return (
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, borderRadius:12, padding:'13px 16px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.22)', marginBottom:4 }}>
                  <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>⚡</span>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:'#fbbf24', margin:'0 0 5px' }}>
                      {urgent.length} action item{urgent.length > 1 ? 's' : ''} due this week
                    </p>
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      {urgent.map((a: any, i: number) => (
                        <p key={i} style={{ fontSize:12, color:'rgba(245,158,11,0.7)', margin:0 }}>
                          · {a.task}{a.owner ? ` (${a.owner})` : ''} — {a.due_date}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}

            {tab === 'protocol' && !protocol && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 0', borderRadius: 16, background: C.card, border: `1px solid ${C.border}` }}>
                <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
              </div>
            )}

            {tab === 'protocol' && protocol && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Summary */}
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

                {/* Agenda */}
                {protocol.agenda_items?.length > 0 && (
                  <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
                    <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 16px' }}>Agenda</h2>
                    <div>
                      {protocol.agenda_items.map((item: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 0',
                          borderBottom: i < protocol.agenda_items.length - 1 ? `1px solid ${C.border}` : 'none',
                        }}>
                          <span style={{ fontSize: 13, color: C.text2 }}>{item.title}</span>
                          {item.duration_min && (
                            <span style={{ fontSize: 12, fontWeight: 500, borderRadius: 99, padding: '2px 10px', background: 'rgba(99,102,241,0.1)', color: C.accentHi }}>
                              {item.duration_min}m
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key decisions */}
                {protocol.key_decisions?.length > 0 && (
                  <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
                    <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 16px' }}>Key Decisions</h2>
                    <ol style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {protocol.key_decisions.map((d: any, i: number) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <span style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                            background: 'rgba(99,102,241,0.12)', color: C.accentHi,
                            fontSize: 10, fontWeight: 800,
                          }}>{i + 1}</span>
                          <span style={{ fontSize: 13, lineHeight: 1.6, color: C.text2 }}>{d.decision ?? d}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Action items */}
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
                          <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 9px', background: pct === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.12)', color: pct === 100 ? '#34d399' : C.accentHi }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: pct === 100 ? '#10b981' : 'linear-gradient(90deg,#6366f1,#818cf8)', width: `${pct}%`, transition: 'width 0.4s ease' }} />
                      </div>
                      {/* Status legend */}
                      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        {(['todo','in-progress','done','blocked'] as const).map(st => {
                          const cfg = ACTION_STATUS_CONFIG[st]
                          const cnt = protocol.action_items.filter((_: any, i: number) => (actionStatuses[i] ?? 'todo') === st).length
                          return cnt > 0 ? (
                            <span key={st} style={{ fontSize: 10, color: cfg.color }}>
                              {cfg.sym} {cnt} {cfg.label}
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                    {protocol.action_items.map((item: any, i: number) => {
                      const status = actionStatuses[i] ?? 'todo'
                      const cfg = ACTION_STATUS_CONFIG[status]
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '13px 20px', cursor: 'pointer', transition: 'background 0.1s',
                            borderBottom: i < protocol.action_items.length - 1 ? `1px solid ${C.border}` : 'none',
                            background: status === 'done' ? 'rgba(16,185,129,0.03)' : status === 'blocked' ? 'rgba(239,68,68,0.03)' : 'transparent',
                          }}
                          onClick={() => updateActionStatus(i)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = status === 'done' ? 'rgba(16,185,129,0.06)' : status === 'blocked' ? 'rgba(239,68,68,0.06)' : C.surface }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = status === 'done' ? 'rgba(16,185,129,0.03)' : status === 'blocked' ? 'rgba(239,68,68,0.03)' : 'transparent' }}
                        >
                          {/* Status badge — click to cycle */}
                          <div title={`Click to cycle: ${status} → next`} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 22, borderRadius: 6, flexShrink: 0,
                            background: cfg.bg, border: `1px solid ${cfg.border}`,
                            fontSize: 11, color: cfg.color, fontWeight: 700, transition: 'all 0.15s',
                          }}>
                            {cfg.sym}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: 13, fontWeight: 500, margin: 0, transition: 'color 0.15s',
                              color: status === 'done' ? C.text3 : status === 'blocked' ? '#f87171' : C.text1,
                              textDecoration: status === 'done' ? 'line-through' : 'none',
                            }}>{item.task}</p>
                            {item.owner && <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>👤 {item.owner}</p>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {item.due_date && <span style={{ fontSize: 11, color: C.text3 }}>{format(new Date(item.due_date), 'MMM d')}</span>}
                            {item.priority && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 8px',
                                ...(item.priority === 'high'
                                  ? { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
                                  : item.priority === 'medium'
                                  ? { background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }
                                  : { background: 'rgba(99,102,241,0.12)', color: C.accentHi }),
                              }}>
                                {item.priority}
                              </span>
                            )}
                            <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  )
                })()}

                {/* Open questions */}
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

                {/* Next meeting */}
                {protocol.next_meeting && (
                  <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
                    <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 12px' }}>Next Meeting</h2>
                    {protocol.next_meeting.proposed_date && (
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text1, margin: '0 0 8px' }}>
                        📅 {protocol.next_meeting.proposed_date}
                      </p>
                    )}
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
            )}

            {/* ── TRANSCRIPT TAB ───────────────────────────── */}
            {tab === 'transcript' && (
              <div style={{ borderRadius: 16, overflow: 'hidden', background: C.card, border: `1px solid ${C.border}` }}>
                {!transcript ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
                    <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Toolbar: search + speaker filter + replay */}
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Search */}
                        <div style={{ flex: 1, position: 'relative' }}>
                          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.text3, pointerEvents: 'none' }} />
                          <input
                            id="tx-search"
                            type="text"
                            value={txSearch}
                            onChange={(e) => setTxSearch(e.target.value)}
                            placeholder="Search transcript… (press /)"
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
                              borderRadius: 8, padding: '7px 10px 7px 30px',
                              fontSize: 12, color: C.text1, outline: 'none', fontFamily: 'inherit',
                              transition: 'border-color 0.15s',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                          />
                          {txSearch && (
                            <button onClick={() => setTxSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text3, display: 'flex', padding: 2 }}>
                              <X style={{ width: 12, height: 12 }} />
                            </button>
                          )}
                        </div>
                        {/* Replay toggle */}
                        {mediaUrl && (
                          <button
                            onClick={() => setReplayMode(r => !r)}
                            title="Replay mode: auto-scroll to current line"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              borderRadius: 7, padding: '6px 11px', fontSize: 11, fontWeight: 600,
                              border: `1px solid ${replayMode ? 'rgba(99,102,241,0.5)' : C.border}`,
                              background: replayMode ? 'rgba(99,102,241,0.12)' : 'transparent',
                              color: replayMode ? C.accentHi : C.text3,
                              cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                            }}
                          >
                            <Zap style={{ width: 11, height: 11 }} />Replay
                          </button>
                        )}
                      </div>
                      {/* Speaker filter chips */}
                      {uniqueSpeakers.length > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter</span>
                          {uniqueSpeakers.map((spk, si) => {
                            const col = SPEAKER_COLORS[si % SPEAKER_COLORS.length]
                            const active = txSpeaker === spk
                            return (
                              <button key={spk} onClick={() => setTxSpeaker(active ? null : spk)} style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                                border: `1px solid ${active ? col.bar : 'rgba(255,255,255,0.1)'}`,
                                background: active ? col.bg : 'transparent',
                                color: active ? col.text : C.text3, cursor: 'pointer', transition: 'all 0.15s',
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.bar, flexShrink: 0 }} />
                                {sn(spk)}
                              </button>
                            )
                          })}
                          {(txSearch || txSpeaker) && (
                            <span style={{ fontSize: 11, color: C.text3 }}>
                              {filteredTurns.length} result{filteredTurns.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Key moments bar */}
                    {keyMoments.length > 0 && !txSearch && !txSpeaker && (
                      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(99,102,241,0.03)' }}>
                        <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(99,102,241,0.55)', margin: '0 0 8px' }}>⚡ Key Moments</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {keyMoments.map((km: any, ki: number) => (
                            <button key={ki} onClick={() => { if (mediaUrl) seekTo(km.start); setExpanded(
                              (transcript.speaker_turns as any[]).findIndex((t: any) => t.start === km.start)
                            )}}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                                border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.06)',
                                color: C.text2, cursor: 'pointer', transition: 'all 0.15s',
                                maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)' }}
                              title={km.text}
                            >
                              <span style={{ fontSize: 9, color: C.text3, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                {Math.floor(km.start / 60)}:{String(Math.floor(km.start % 60)).padStart(2, '0')}
                              </span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {km.text?.slice(0, 40)}{(km.text?.length ?? 0) > 40 ? '…' : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transcript lines */}
                    {filteredTurns.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: C.text3, fontSize: 13 }}>
                        No results for &ldquo;{txSearch}&rdquo;
                      </div>
                    ) : filteredTurns.map((line: any, fi: number) => {
                      const origIdx = (transcript.speaker_turns as any[]).findIndex((t: any) => t === line)
                      const speakerIdx = speakerStats.findIndex(s => s.speaker === line.speaker)
                      const color = SPEAKER_COLORS[speakerIdx % SPEAKER_COLORS.length]
                      const isActive = origIdx === activeTurnIndex
                      const isKm = keyMoments.some((km: any) => km.start === line.start)
                      // Highlight search match in text
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
                          id={`tx-turn-${origIdx}`}
                          key={fi}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 14,
                            padding: '14px 20px', transition: 'background 0.1s',
                            borderBottom: fi < filteredTurns.length - 1 ? `1px solid ${C.border}` : 'none',
                            background: isActive ? color.bg : 'transparent',
                            cursor: mediaUrl ? 'pointer' : 'default',
                            borderLeft: isKm ? `2px solid rgba(99,102,241,0.4)` : '2px solid transparent',
                          }}
                          onClick={() => mediaUrl && seekTo(line.start)}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = C.surface }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? color.bg : 'transparent' }}
                        >
                          <span style={{ marginTop: 1, width: 42, flexShrink: 0, fontSize: 11, fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: C.text3 }}>
                            {Math.floor(line.start / 60)}:{String(Math.floor(line.start % 60)).padStart(2, '0')}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ marginBottom: 4, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: isActive ? color.text : C.accentHi }}>
                              <span
                                title="Click to rename speaker"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRenamingSpk(line.speaker); setRenameInput(speakerNames[line.speaker] || '') }}
                                style={{ cursor: 'pointer', borderBottom: '1px dashed currentColor', paddingBottom: 1 }}
                              >{sn(line.speaker)}</span>
                              {isActive && <span style={{ marginLeft: 8, fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: color.text }}>● speaking</span>}
                              {isKm && !isActive && <span style={{ marginLeft: 8, fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'rgba(99,102,241,0.55)', fontSize: 9 }}>★ key moment</span>}
                            </p>
                            <p style={{
                              fontSize: 13, lineHeight: 1.65, color: C.text2, margin: 0,
                              display: expanded === origIdx ? undefined : '-webkit-box',
                              WebkitLineClamp: expanded === origIdx ? undefined : 3,
                              WebkitBoxOrient: expanded === origIdx ? undefined : 'vertical' as any,
                              overflow: expanded === origIdx ? undefined : 'hidden',
                            }}>
                              {renderText()}
                            </p>
                          </div>
                          <ChevronDown
                            style={{ marginTop: 2, width: 14, height: 14, flexShrink: 0, color: C.text3, transition: 'transform 0.15s', transform: expanded === origIdx ? 'rotate(180deg)' : undefined }}
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExpanded(expanded === origIdx ? null : origIdx) }}
                          />
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}

            {/* ── DOCUMENT TAB ─────────────────────────────── */}
            {tab === 'document' && !protocol && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 0', borderRadius: 16, background: C.card, border: `1px solid ${C.border}` }}>
                <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
              </div>
            )}
            {tab === 'document' && protocol && (
              <div style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                {/* Indigo top accent */}
                <div style={{ height: 3, background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #6366f1 100%)' }} />

                <div style={{ padding: '36px 40px', background: '#0b0b16' }}>

                  {/* Document header */}
                  <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: C.accentHi, margin: '0 0 14px' }}>
                      Mira · Meeting Protocol
                    </p>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text1, letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.25 }}>
                      {meeting.title}
                    </h1>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                      {[
                        format(new Date(meeting.meeting_date), 'MMMM d, yyyy'),
                        meeting.language ? (LANG[meeting.language] ?? meeting.language) : null,
                        meeting.participants?.length > 0 ? meeting.participants.join(' · ') : null,
                      ].filter(Boolean).map((meta: any, i) => (
                        <span key={i} style={{ fontSize: 12, color: C.text3 }}>{meta}</span>
                      ))}
                    </div>
                    <NoteArea value={notes['header'] || ''} onChange={(v) => updateNote('header', v)} />
                  </div>

                  {/* Summary */}
                  {protocol.summary && (
                    <DocBlock title="Summary">
                      <p style={{ fontSize: 14, lineHeight: 1.75, color: C.text2, margin: 0 }}>{protocol.summary}</p>
                      <NoteArea value={notes['summary'] || ''} onChange={(v) => updateNote('summary', v)} />
                    </DocBlock>
                  )}

                  {/* Agenda */}
                  {protocol.agenda_items?.length > 0 && (
                    <DocBlock title="Agenda">
                      <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {protocol.agenda_items.map((item: any, i: number) => (
                          <li key={i} style={{ fontSize: 14, color: C.text2, lineHeight: 1.65 }}>
                            {item.title}{item.duration_min ? ` — ${item.duration_min}m` : ''}
                          </li>
                        ))}
                      </ol>
                      <NoteArea value={notes['agenda'] || ''} onChange={(v) => updateNote('agenda', v)} />
                    </DocBlock>
                  )}

                  {/* Key Decisions */}
                  {protocol.key_decisions?.length > 0 && (
                    <DocBlock title="Key Decisions">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {protocol.key_decisions.map((d: any, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 5, background: 'rgba(99,102,241,0.12)', color: C.accentHi, fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                            <span style={{ fontSize: 14, lineHeight: 1.65, color: C.text2 }}>{d.decision ?? d}</span>
                          </div>
                        ))}
                      </div>
                      <NoteArea value={notes['decisions'] || ''} onChange={(v) => updateNote('decisions', v)} />
                    </DocBlock>
                  )}

                  {/* Action Items */}
                  {protocol.action_items?.length > 0 && (
                    <DocBlock title="Action Items">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {protocol.action_items.map((item: any, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0, marginTop: 3 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, lineHeight: 1.6, color: C.text2, margin: 0 }}>{item.task}</p>
                              <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
                                {item.owner    && <span style={{ fontSize: 11, color: C.text3 }}>👤 {item.owner}</span>}
                                {item.due_date && <span style={{ fontSize: 11, color: C.text3 }}>📅 {item.due_date}</span>}
                                {item.priority && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: item.priority === 'high' ? '#f87171' : item.priority === 'medium' ? '#fbbf24' : C.accentHi }}>
                                    {item.priority.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <NoteArea value={notes['actions'] || ''} onChange={(v) => updateNote('actions', v)} />
                    </DocBlock>
                  )}

                  {/* Open Questions */}
                  {protocol.open_questions?.length > 0 && (
                    <DocBlock title="Open Questions">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {protocol.open_questions.map((q: any, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(99,102,241,0.45)', flexShrink: 0, marginTop: 7 }} />
                            <span style={{ fontSize: 14, lineHeight: 1.65, color: C.text2 }}>{q.question ?? q}</span>
                          </div>
                        ))}
                      </div>
                      <NoteArea value={notes['questions'] || ''} onChange={(v) => updateNote('questions', v)} />
                    </DocBlock>
                  )}

                  {/* Next Meeting */}
                  {protocol.next_meeting && (
                    <DocBlock title="Next Meeting" last>
                      {protocol.next_meeting.proposed_date && (
                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text1, margin: '0 0 8px' }}>📅 {protocol.next_meeting.proposed_date}</p>
                      )}
                      {protocol.next_meeting.topics?.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none' }}>
                          {protocol.next_meeting.topics.map((t: string, i: number) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.text2 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(99,102,241,0.4)', flexShrink: 0 }} />{t}
                            </li>
                          ))}
                        </ul>
                      )}
                      <NoteArea value={notes['nextMeeting'] || ''} onChange={(v) => updateNote('nextMeeting', v)} />
                    </DocBlock>
                  )}

                  {/* Footer */}
                  <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: C.text3, letterSpacing: '0.04em' }}>
                      Generated by Mira · {format(new Date(), 'MMMM d, yyyy')}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(99,102,241,0.45)', letterSpacing: '0.06em' }}>MIRA.AI</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── ANALYTICS TAB ────────────────────────────── */}
            {tab === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Meeting Outcome / Sentiment */}
                {sentiment && (
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
                          { label: 'Decisions', value: sentiment.decisions, color: '#818cf8' },
                          { label: 'Open Questions', value: sentiment.openQ, color: sentiment.openQ > 0 ? '#fbbf24' : '#34d399' },
                          { label: 'Next Meeting', value: protocol?.next_meeting?.proposed_date ?? '—', color: protocol?.next_meeting ? '#34d399' : C.text3, small: true },
                        ].map(({ label, value, color, small }) => (
                          <div key={label} style={{ textAlign: 'center', padding: '12px 18px', background: C.surface }}>
                            <p style={{ fontSize: small ? 12 : 24, fontWeight: 800, color, margin: 0, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</p>
                            <p style={{ fontSize: 10, color: C.text3, margin: '3px 0 0', whiteSpace: 'nowrap' }}>{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Agenda Completion */}
                {agendaCompletion && (() => {
                  const STATUS_CFG = {
                    resolved: { label: 'Resolved', color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
                    discussed: { label: 'Discussed', color: '#818cf8', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)' },
                    open: { label: 'Open', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
                  }
                  return (
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
                          const st = agendaCompletion.statuses[i]
                          const cfg = STATUS_CFG[st]
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, flexShrink: 0, width: 60, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</span>
                              <span style={{ fontSize: 13, color: C.text2, flex: 1, lineHeight: 1.4 }}>{item.title}</span>
                              {item.duration_min && <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{item.duration_min}m</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Talk Time Distribution */}
                {speakerStats.length > 0 && (
                  <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 18px' }}>Talk Time Distribution</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {speakerStats.map(({ speaker, words, seconds, pct, color }) => (
                        <div key={speaker}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color.bar }} />
                              <span
                                style={{ fontSize: 13, fontWeight: 500, color: C.text1, cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.15)' }}
                                title="Click to rename"
                                onClick={() => { setRenamingSpk(speaker); setRenameInput(speakerNames[speaker] || '') }}
                              >{sn(speaker)}</span>
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

                {/* Speaker Timeline */}
                {speakerStats.length > 0 && duration > 0 && (
                  <div style={{ borderRadius: 16, padding: 24, background: C.card, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text3, margin: '0 0 18px' }}>Speaker Timeline</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {speakerStats.map(({ speaker, color }) => (
                        <div key={speaker} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ width: 72, flexShrink: 0, fontSize: 11, fontWeight: 500, textAlign: 'right', color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sn(speaker)}</span>
                          <div style={{ flex: 1, height: 22, borderRadius: 6, overflow: 'hidden', position: 'relative', background: 'rgba(255,255,255,0.04)' }}>
                            {(transcript?.speaker_turns as any[] ?? [])
                              .filter((t) => t.speaker === speaker)
                              .map((t, i) => (
                                <div key={i}
                                  style={{
                                    position: 'absolute', top: 2, bottom: 2, borderRadius: 3, cursor: 'pointer',
                                    left: `${(t.start / duration) * 100}%`,
                                    width: `${Math.max(0.4, (t.end - t.start) / duration * 100)}%`,
                                    background: color.bar, opacity: 0.8, transition: 'opacity 0.1s',
                                  }}
                                  onClick={() => { seekTo(t.start); setTab('transcript') }}
                                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                                  title={`${formatTime(t.start)} — ${t.text?.slice(0, 60)}…`}
                                />
                              ))}
                            {mediaUrl && (
                              <div style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)', pointerEvents: 'none', left: `${(currentTime / duration) * 100}%` }} />
                            )}
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
            )}
          </>
        )}
      </div>

      {/* Speaker rename modal */}
      {renamingSpk && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setRenamingSpk(null)}
        >
          <div
            style={{ background: '#181626', borderRadius: 20, padding: 28, width: 360, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#818cf8', flexShrink: 0 }}>
                {sn(renamingSpk).charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text1, margin: 0, lineHeight: 1.2 }}>{sn(renamingSpk)}</p>
                <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Set a display name for this speaker</p>
              </div>
            </div>
            {/* Input */}
            <input
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') setRenamingSpk(null) }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              placeholder="e.g. Ariunjargal"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '11px 14px', borderRadius: 10, fontSize: 14,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                color: C.text1, outline: 'none', marginBottom: 6,
                transition: 'border-color 0.15s',
              }}
            />
            <p style={{ fontSize: 11, color: C.text3, margin: '0 0 18px' }}>Leave blank to reset to auto-name</p>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setRenamingSpk(null)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: C.text2 }}
              >Cancel</button>
              {speakerNames[renamingSpk] && (
                <button
                  onClick={() => {
                    const updated = Object.fromEntries(Object.entries(speakerNames).filter(([k]) => k !== renamingSpk))
                    setSpeakerNames(updated)
                    try { localStorage.setItem(`mira-speakers-${id}`, JSON.stringify(updated)) } catch {}
                    setRenamingSpk(null)
                  }}
                  style={{ padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}
                >Clear</button>
              )}
              <button
                onClick={doRename}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: C.accent, border: 'none', color: '#fff' }}
              >Save name</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
