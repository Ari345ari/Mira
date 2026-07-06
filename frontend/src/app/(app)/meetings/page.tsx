'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Loader2, Search, Plus, X, MoreHorizontal, ExternalLink, Link2, Check, Trash2 } from 'lucide-react'
import { useMeetings, useDeleteMeeting } from '@/hooks/use-meetings'
import { useWorkspaceStore } from '@/store/workspace'
import { useWorkspaces } from '@/hooks/use-meetings'
import { MeetingStatus } from '@/types'
import { gsap } from 'gsap'
import toast from 'react-hot-toast'
import { fmtDur, dateLabel } from '@/lib/format'
import { TiltRow } from '@/components/meetings/tilt-row'

const PROCESSING_STATUSES = [
  MeetingStatus.QUEUED, MeetingStatus.UPLOADING, MeetingStatus.TRANSCRIBING,
  MeetingStatus.ANALYZING, MeetingStatus.GENERATING_PROTOCOL, MeetingStatus.DIARIZING,
]

const WS_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444']

type Filter = 'all' | 'done' | 'processing' | 'failed'

const FILTER_CONFIG: Record<Filter, { label: string; color: string; glow: string; dot: string; shadow: string }> = {
  all:        { label: 'All',        color: 'rgba(255,255,255,0.7)',  glow: 'rgba(255,255,255,0.05)', dot: 'rgba(255,255,255,0.35)', shadow: 'rgba(255,255,255,0.08)' },
  done:       { label: 'Done',       color: '#34d399',                glow: 'rgba(16,185,129,0.12)',  dot: '#10b981',                shadow: 'rgba(16,185,129,0.18)' },
  processing: { label: 'Processing', color: '#fbbf24',                glow: 'rgba(245,158,11,0.1)',   dot: '#f59e0b',                shadow: 'rgba(245,158,11,0.15)' },
  failed:     { label: 'Failed',     color: '#f87171',                glow: 'rgba(239,68,68,0.1)',    dot: '#ef4444',                shadow: 'rgba(239,68,68,0.14)' },
}

export default function MeetingsPage() {
  const router = useRouter()
  const { activeWsId, setActiveWsId } = useWorkspaceStore()
  const { data: workspaces, isLoading: wsLoading } = useWorkspaces()

  // For new users with no saved workspace, default to first workspace once loaded
  const filterWsId = activeWsId ?? workspaces?.[0]?.id
  const currentWs  = workspaces?.find((w: any) => w.id === filterWsId)

  // Auto-persist the defaulted workspace so switching later works correctly
  useEffect(() => {
    if (!activeWsId && filterWsId) setActiveWsId(filterWsId)
  }, [activeWsId, filterWsId, setActiveWsId])

  const { data: meetings = [], isLoading: meetingsLoading } = useMeetings(filterWsId)
  // Show skeleton while workspaces are loading OR while meetings are loading
  const isLoading = wsLoading || meetingsLoading || !filterWsId
  const { mutate: deleteMeeting, isPending: deleting } = useDeleteMeeting()
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<Filter>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [visibleCount, setVisibleCount]   = useState(10)
  const [menuOpen, setMenuOpen]     = useState<string | null>(null)
  const [menuPos, setMenuPos]       = useState({ x: 0, y: 0 })
  const [linkCopied, setLinkCopied] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click or scroll
  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(null)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true) }
  }, [menuOpen])

  function openMenu(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPos({ x: rect.right, y: rect.bottom + 6 })
    setMenuOpen(prev => prev === id ? null : id)
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/meetings/${id}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1800)
    setMenuOpen(null)
  }

  const done       = meetings.filter((m: any) => m.status === MeetingStatus.DONE).length
  const processing = meetings.filter((m: any) => PROCESSING_STATUSES.includes(m.status)).length
  const failed     = meetings.filter((m: any) => m.status === MeetingStatus.FAILED).length

  const FILTER_COUNTS: Record<Filter, number> = { all: meetings.length, done, processing, failed }

  const filtered = meetings.filter((m: any) => {
    const isProc = PROCESSING_STATUSES.includes(m.status)
    return (
      (!search || m.title.toLowerCase().includes(search.toLowerCase())) &&
      (filter === 'all' ||
        (filter === 'done'       && m.status === MeetingStatus.DONE) ||
        (filter === 'failed'     && m.status === MeetingStatus.FAILED) ||
        (filter === 'processing' && isProc))
    )
  }).sort((a: any, b: any) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime())

  /* Stagger-in rows each time the list changes */
  useEffect(() => {
    if (!listRef.current) return
    const rows = listRef.current.querySelectorAll<HTMLElement>('.meeting-row')
    gsap.fromTo(rows,
      { opacity: 0, rotateX: -18, y: 22, z: -30, transformPerspective: 900 },
      { opacity: 1, rotateX: 0, y: 0, z: 0, duration: 0.5, ease: 'power3.out', stagger: 0.045, overwrite: true }
    )
  }, [filtered.length, filter, search])

  /* Subtle page-level tilt on mouse move */
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      gsap.to(el, { rotateX: -ny * 2, rotateY: nx * 2, transformPerspective: 1800, duration: 0.6, ease: 'power2.out', overwrite: true })
    }
    const onLeave = () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1, ease: 'elastic.out(1,0.5)', overwrite: true })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseleave', onLeave) }
  }, [])

  return (
    <>
    <div style={{ minHeight: '100%', padding: '44px 52px 72px', maxWidth: 820, margin: '0 auto', perspective: '1200px' }}>

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div ref={headerRef} style={{ transformStyle: 'preserve-3d', willChange: 'transform', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {currentWs && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: WS_COLORS[(currentWs.name?.charCodeAt(0) ?? 0) % WS_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>
                  {currentWs.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>{currentWs.name}</span>
              </div>
            )}
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.035em', margin: 0 }}>
              Recordings
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '5px 0 0' }}>
              {meetings.length} {meetings.length === 1 ? 'file' : 'files'} · {done} analyzed
            </p>
          </div>

          <Link href="/upload" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: '#818cf8',
            padding: '8px 14px', borderRadius: 9,
            border: '1px solid rgba(99,102,241,0.28)',
            background: 'rgba(99,102,241,0.06)',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'rgba(99,102,241,0.55)'; el.style.background = 'rgba(99,102,241,0.12)'
              el.style.boxShadow = '0 6px 24px rgba(99,102,241,0.28), inset 0 1px 0 rgba(255,255,255,0.06)'
              gsap.to(el, { y: -2, scale: 1.04, duration: 0.2, ease: 'power2.out' })
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'rgba(99,102,241,0.28)'; el.style.background = 'rgba(99,102,241,0.06)'
              el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)'
              gsap.to(el, { y: 0, scale: 1, duration: 0.4, ease: 'elastic.out(1,0.5)' })
            }}
          >
            <Plus style={{ width: 13, height: 13 }} /> Upload
          </Link>
        </div>
      </div>

      {/* ── TOOLBAR ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 300 }}>
          <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recordings…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 9, padding: '8px 10px 8px 32px',
              fontSize: 13, color: '#f1f5f9', outline: 'none', fontFamily: 'inherit',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
              transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'
              e.currentTarget.style.background = 'rgba(99,102,241,0.04)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.15), inset 0 1px 0 rgba(99,102,241,0.05)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', padding: 2 }}>
              <X style={{ width: 11, height: 11 }} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {(Object.keys(FILTER_CONFIG) as Filter[]).map((f) => {
            const cfg = FILTER_CONFIG[f]
            const active = filter === f
            const count = FILTER_COUNTS[f]
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${active ? cfg.color + '44' : 'rgba(255,255,255,0.07)'}`,
                  background: active ? cfg.glow : 'transparent',
                  color: active ? cfg.color : 'rgba(255,255,255,0.48)',
                  cursor: 'pointer',
                  /* 3D raised look */
                  boxShadow: active
                    ? `0 4px 16px ${cfg.shadow}, 0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(0,0,0,0.3) inset`
                    : '0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                  transform: active ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    const el = e.currentTarget
                    el.style.color = 'rgba(255,255,255,0.82)'
                    el.style.borderColor = 'rgba(255,255,255,0.18)'
                    el.style.transform = 'translateY(-1px) scale(1.03)'
                    el.style.boxShadow = `0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    const el = e.currentTarget
                    el.style.color = 'rgba(255,255,255,0.48)'
                    el.style.borderColor = 'rgba(255,255,255,0.07)'
                    el.style.transform = 'translateY(0) scale(1)'
                    el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)'
                  }
                }}
              >
                {f !== 'all' && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: `radial-gradient(circle at 35% 35%, ${cfg.dot}ee, ${cfg.dot})`,
                    boxShadow: active ? `0 0 8px ${cfg.dot}` : `0 1px 3px ${cfg.dot}66`,
                  }} />
                )}
                {cfg.label}
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: active ? cfg.color : 'rgba(255,255,255,0.28)',
                  background: 'rgba(255,255,255,0.06)', borderRadius: 99, padding: '1px 6px',
                }}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── LIST ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ padding: '64px 0', display: 'flex', justifyContent: 'center' }}>
          <Loader2 style={{ width: 16, height: 16, color: '#6366f1' }} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '64px 0', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
            {search || filter !== 'all' ? 'Nothing matches that filter' : 'No recordings yet'}
          </p>
        </div>
      ) : (
        <>
        {/* ── outer 3-D wrapper ── */}
        <div
          ref={listRef}
          style={{
            perspective: '1000px',
            perspectiveOrigin: '50% 40%',
          }}
        >
          <div style={{
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18,
            overflow: 'hidden',
            background: 'rgba(14,14,22,0.72)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            /* multi-layer depth shadows */
            boxShadow: [
              '0 2px 0 rgba(255,255,255,0.04) inset',
              '0 -1px 0 rgba(0,0,0,0.5) inset',
              '0 1px 3px rgba(0,0,0,0.18)',
              '0 8px 24px rgba(0,0,0,0.38)',
              '0 32px 64px rgba(0,0,0,0.28)',
              '0 0 0 1px rgba(255,255,255,0.025)',
            ].join(', '),
            transformStyle: 'preserve-3d',
          }}>
            {filtered.slice(0, visibleCount).map((m: any, i: number) => {
              const isProc = PROCESSING_STATUSES.includes(m.status)
              const statusColor =
                m.status === MeetingStatus.DONE    ? '#10b981' :
                m.status === MeetingStatus.FAILED  ? '#ef4444' :
                isProc                             ? '#f59e0b' :
                'rgba(255,255,255,0.12)'
              const glowColor =
                m.status === MeetingStatus.DONE    ? 'rgba(16,185,129,0.18)' :
                m.status === MeetingStatus.FAILED  ? 'rgba(239,68,68,0.15)' :
                isProc                             ? 'rgba(245,158,11,0.14)' :
                'rgba(99,102,241,0.10)'

              return (
                <TiltRow
                  key={m.id}
                  href={`/meetings/${m.id}`}
                  statusColor={statusColor}
                  glowColor={glowColor}
                  isLast={i === Math.min(visibleCount, filtered.length) - 1}
                >
                  <div
                    className="meeting-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px',
                      position: 'relative', zIndex: 1,
                      transition: 'padding-left 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.paddingLeft = '26px'
                      el.style.background = `linear-gradient(90deg, ${glowColor}, rgba(99,102,241,0.05))`
                      const arrow = el.querySelector('.row-arrow') as HTMLElement | null
                      if (arrow) { arrow.style.opacity = '1'; arrow.style.transform = 'translateX(0)' }
                      const title = el.querySelector('.row-title') as HTMLElement | null
                      if (title) title.style.color = '#fff'
                      const del = el.querySelector('.row-delete') as HTMLElement | null
                      if (del) del.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.paddingLeft = '20px'
                      el.style.background = ''
                      const arrow = el.querySelector('.row-arrow') as HTMLElement | null
                      if (arrow) { arrow.style.opacity = '0'; arrow.style.transform = 'translateX(-6px)' }
                      const title = el.querySelector('.row-title') as HTMLElement | null
                      if (title) title.style.color = 'rgba(255,255,255,0.82)'
                      const del = el.querySelector('.row-delete') as HTMLElement | null
                      if (del) del.style.opacity = '0'
                    }}
                  >
                    {/* 3-D sphere dot */}
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: `radial-gradient(circle at 35% 30%, ${statusColor}ff, ${statusColor}99)`,
                      boxShadow: `0 0 ${isProc ? '12px' : '6px'} ${statusColor}, 0 1px 3px rgba(0,0,0,0.5)`,
                      ...(isProc ? { animation: 'pulse 1.4s ease-in-out infinite' } : {}),
                    }} />

                    {/* Title + uploaded timestamp */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="row-title" style={{
                        display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.82)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontWeight: 400, letterSpacing: '-0.01em', transition: 'color 0.12s',
                      }}>
                        {m.title}
                      </span>
                      {m.created_at && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', display: 'block', marginTop: 1 }}>
                          Uploaded {format(new Date(m.created_at), 'MMM d, yyyy · h:mm a')}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {dateLabel(m.meeting_date)}
                    </span>

                    {m.duration_seconds && (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', flexShrink: 0, fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
                        {fmtDur(m.duration_seconds)}
                      </span>
                    )}

                    {/* ⋯ menu button — reveals on row hover */}
                    <button
                      className="row-delete"
                      onClick={(e) => openMenu(e, m.id)}
                      title="More options"
                      style={{
                        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 26, height: 26, borderRadius: 7,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                        opacity: 0, transition: 'opacity 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                    >
                      <MoreHorizontal style={{ width: 13, height: 13 }} />
                    </button>

                    <span className="row-arrow" style={{
                      fontSize: 13, color: '#818cf8', flexShrink: 0,
                      opacity: 0, transform: 'translateX(-6px)',
                      transition: 'opacity 0.15s, transform 0.15s', marginLeft: 2,
                    }}>→</span>
                  </div>
                </TiltRow>
              )
            })}
          </div>
        </div>

        {/* Show more / collapse */}
        {filtered.length > 10 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            {visibleCount < filtered.length ? (
              <button
                onClick={() => setVisibleCount(v => v + 10)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#818cf8'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
              >
                Show {Math.min(10, filtered.length - visibleCount)} more
                <span style={{ color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>({filtered.length - visibleCount} remaining)</span>
              </button>
            ) : (
              <button
                onClick={() => setVisibleCount(10)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
              >
                Collapse
              </button>
            )}
          </div>
        )}
        </>
      )}

    </div>

      {/* ── DROPDOWN MENU ─────────────────────────────── */}
      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: menuPos.y,
            right: window.innerWidth - menuPos.x,
            zIndex: 1000,
            background: '#1a1929',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '5px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            minWidth: 160,
          }}
        >
          {[
            {
              icon: ExternalLink,
              label: 'Open',
              color: 'rgba(255,255,255,0.82)',
              action: () => { router.push(`/meetings/${menuOpen}`); setMenuOpen(null) },
            },
            {
              icon: linkCopied ? Check : Link2,
              label: linkCopied ? 'Copied!' : 'Copy link',
              color: linkCopied ? '#34d399' : 'rgba(255,255,255,0.82)',
              action: () => copyLink(menuOpen),
            },
            null,
            {
              icon: Trash2,
              label: 'Delete',
              color: '#f87171',
              action: () => { setConfirmDelete(menuOpen); setMenuOpen(null) },
            },
          ].map((item, i) =>
            item === null ? (
              <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 6px' }} />
            ) : (
              <button
                key={i}
                onClick={item.action}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, color: item.color,
                  transition: 'background 0.1s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = item.color === '#f87171' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.07)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <item.icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                {item.label}
              </button>
            )
          )}
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ─────────────────────── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setConfirmDelete(null)}
        >
          <div style={{
            background: '#13121f', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 16, padding: '28px 32px', maxWidth: 380, width: '90%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>Delete recording?</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px', lineHeight: 1.55 }}>
              This will permanently remove the recording, transcript, and all analysis. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
              >Cancel</button>
              <button
                disabled={deleting}
                onClick={() => {
                  deleteMeeting(confirmDelete, {
                    onSuccess: () => { toast.success('Recording deleted'); setConfirmDelete(null) },
                    onError: () => toast.error('Could not delete recording'),
                  })
                }}
                style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
              >{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
