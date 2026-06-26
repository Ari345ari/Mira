'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('@/components/landing/scene'), { ssr: false })

function AnimatedMark({ size = 32 }: { size?: number }) {
  const bars = [
    { h: 0.22, op: 0.4, delay: '0.35s', dur: '1.05s' },
    { h: 0.55, op: 0.6, delay: '0.15s', dur: '0.85s' },
    { h: 1.0,  op: 1.0, delay: '0s',    dur: '0.95s' },
    { h: 0.55, op: 0.6, delay: '0.25s', dur: '0.80s' },
    { h: 0.22, op: 0.4, delay: '0.45s', dur: '1.0s'  },
  ]
  const gap  = size * 0.16
  const barW = (size - gap * 4) / 5
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap, height: size, flexShrink: 0 }}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            width: barW, height: size * b.h,
            borderRadius: barW / 2,
            background: '#818cf8',
            opacity: b.op,
            transformOrigin: 'center bottom',
            animation: `waveBar ${b.dur} ease-in-out infinite`,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let x = window.innerWidth / 2, y = window.innerHeight / 2
    let lx = x, ly = y
    let rafId: number
    const onMove = (e: MouseEvent) => { x = e.clientX; y = e.clientY }
    window.addEventListener('mousemove', onMove, { passive: true })
    function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
    function tick() {
      rafId = requestAnimationFrame(tick)
      lx = lerp(lx, x, 0.06)
      ly = lerp(ly, y, 0.06)
      if (glowRef.current) {
        glowRef.current.style.left = `${lx}px`
        glowRef.current.style.top  = `${ly}px`
      }
    }
    tick()
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('mousemove', onMove) }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#04020f',
      position: 'relative', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Waveform background — same as landing */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.55 }}>
        <Scene />
      </div>

      {/* Ambient glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'rgba(109,40,217,0.15)', filter: 'blur(130px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(99,102,241,0.10)', filter: 'blur(100px)' }} />
      </div>

      {/* Cursor glow */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 5,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Glass card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 420,
        margin: '0 auto',
        padding: '40px 40px',
        background: 'rgba(12,12,22,0.82)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06)',
      }}>
        {/* Logo — links to landing */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, textDecoration: 'none' }}>
          <AnimatedMark size={28} />
          <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>mira</span>
        </a>

        {children}
      </div>
    </div>
  )
}
