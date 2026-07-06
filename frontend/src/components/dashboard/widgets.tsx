'use client'

import { useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { MeetingStatus } from '@/types'

/* ── Status dot ─────────────────────────────────────────────────── */
const PROCESSING_STATUSES = [
  MeetingStatus.QUEUED, MeetingStatus.TRANSCRIBING, MeetingStatus.ANALYZING,
  MeetingStatus.GENERATING_PROTOCOL, MeetingStatus.UPLOADING, MeetingStatus.DIARIZING,
]

export function StatusDot({ status }: { status: MeetingStatus }) {
  if (status === MeetingStatus.DONE)
    return <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.7)', display: 'inline-block', flexShrink: 0 }} />
  if (status === MeetingStatus.FAILED)
    return <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.7)', display: 'inline-block', flexShrink: 0 }} />
  if (PROCESSING_STATUSES.includes(status))
    return <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.8)', display: 'inline-block', flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite' }} />
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'inline-block', flexShrink: 0 }} />
}

/* ── Health ring ─────────────────────────────────────────────────── */
export function HealthRing({ pct }: { pct: number }) {
  const R = 46, CIRC = 2 * Math.PI * R
  const fillRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    if (!fillRef.current) return
    gsap.fromTo(fillRef.current,
      { strokeDashoffset: CIRC },
      { strokeDashoffset: CIRC * (1 - pct), duration: 2.4, ease: 'power3.out', delay: 0.5 },
    )
  }, [pct, CIRC])

  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.18)', animation: 'glow-pulse 3s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1px solid rgba(99,102,241,0.07)', animation: 'glow-pulse 3s ease-in-out infinite', animationDelay: '0.9s', pointerEvents: 'none' }} />
      <svg width={110} height={110} viewBox="-4 -4 118 118">
        <circle cx="55" cy="55" r={R} fill="none" strokeWidth="5" stroke="rgba(255,255,255,0.05)" />
        <circle ref={fillRef} cx="55" cy="55" r={R} fill="none" strokeWidth="5" strokeLinecap="round"
          stroke="url(#ringGrad)"
          style={{ strokeDasharray: CIRC, strokeDashoffset: CIRC, transformOrigin: '55px 55px', transform: 'rotate(-90deg)', filter: 'drop-shadow(0 0 12px rgba(99,102,241,0.7))' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: '#818cf8', lineHeight: 1, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(pct * 10)}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.05em', marginTop: 2 }}>/10</span>
      </div>
    </div>
  )
}

/* ── Wave decor ──────────────────────────────────────────────────── */
export function WaveDecor() {
  const bars = Array.from({ length: 44 }, (_, i) => {
    const arch = Math.sin((i / 43) * Math.PI)
    return { h: 20 + arch * 88, delay: `${(i * 0.065).toFixed(2)}s`, dur: `${0.68 + Math.sin(i * 0.9) * 0.28}s` }
  })
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 120, padding: 0, pointerEvents: 'none', opacity: 0.042 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, height: b.h, borderRadius: 2, background: 'linear-gradient(to top, #6366f1, #818cf8)', transformOrigin: 'bottom', animation: `waveBar ${b.dur} ease-in-out infinite`, animationDelay: b.delay }} />
      ))}
    </div>
  )
}

/* ── 3D tilt card ────────────────────────────────────────────────── */
export function TiltCard({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref     = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top)  / rect.height - 0.5
    gsap.to(ref.current, { rotateX: -ny * 13, rotateY: nx * 13, transformPerspective: 900, scale: 1.025, duration: 0.22, ease: 'power2.out', overwrite: true })
    if (glowRef.current) {
      glowRef.current.style.opacity    = '1'
      glowRef.current.style.background = `radial-gradient(circle at ${(nx + 0.5) * 100}% ${(ny + 0.5) * 100}%, rgba(99,102,241,0.22) 0%, transparent 58%)`
    }
  }, [])

  const onLeave = useCallback(() => {
    gsap.to(ref.current!, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.55, ease: 'power3.out', overwrite: true })
    if (glowRef.current) gsap.to(glowRef.current, { opacity: 0, duration: 0.28 })
  }, [])

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className}
      style={{ ...style, position: 'relative', transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      <div ref={glowRef} style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', opacity: 0, pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  )
}

/* ── Magnetic wrap ───────────────────────────────────────────────── */
export function MagneticWrap({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.28
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.28
    gsap.to(ref.current, { x, y, duration: 0.32, ease: 'power2.out', overwrite: true })
  }, [])

  const onLeave = useCallback(() => {
    gsap.to(ref.current!, { x: 0, y: 0, duration: 0.72, ease: 'elastic.out(1, 0.38)', overwrite: true })
  }, [])

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={style}>
      {children}
    </div>
  )
}

/* ── Aurora orb ─────────────────────────────────────────────────── */
export function AuroraOrb({ color, size, top, right, left, bottom, animation, delay = '0s' }: {
  color: string; size: number; top?: number; right?: number; left?: number; bottom?: number; animation: string; delay?: string
}) {
  return (
    <div style={{
      position: 'absolute', width: size, height: size, borderRadius: '50%',
      background: color, top, right, left, bottom,
      animation: `${animation} ease-in-out infinite`, animationDelay: delay,
      pointerEvents: 'none', willChange: 'transform',
    }} />
  )
}
