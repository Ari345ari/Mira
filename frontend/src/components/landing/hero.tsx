'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const Scene = dynamic(() => import('./scene'), { ssr: false })

const PERKS = [
  'Mongolian & English',
  'Under 60 seconds',
  'Free to start',
]

export default function Hero() {
  const headRef  = useRef<HTMLHeadingElement>(null)
  const subRef   = useRef<HTMLParagraphElement>(null)
  const perksRef = useRef<HTMLDivElement>(null)
  const btnsRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(
      [headRef.current, subRef.current, perksRef.current, btnsRef.current],
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.2 },
    )
  }, [])

  return (
    <section
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        minHeight: '100vh', overflow: 'hidden', background: '#060410',
        padding: '0 24px',
      }}
    >
      {/* Interactive waveform fills the whole section */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Scene />
      </div>

      {/* Radial glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(109,40,217,0.18)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', filter: 'blur(100px)' }} />
      </div>

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      {/* Centered content */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flex: 1, flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', maxWidth: 680, margin: '0 auto', width: '100%',
        paddingTop: 80,
      }}>

        {/* Headline */}
        <h1
          ref={headRef}
          style={{
            fontSize: 'clamp(2.4rem, 6vw, 5rem)',
            fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-0.04em', color: '#ffffff',
            margin: '0 0 24px', whiteSpace: 'nowrap',
          }}
        >
          Every meeting,{' '}
          <span style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 45%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>decoded.</span>
        </h1>

        {/* Sub */}
        <p
          ref={subRef}
          style={{
            fontSize: '1.05rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.52)',
            maxWidth: 500, margin: '0 0 28px',
          }}
        >
          You talk, we handle the rest. Mira listens to your meeting, works out who said what,
          and hands you back a clean write-up — decisions made, tasks assigned, questions still open. Done.
        </p>

        {/* Perks */}
        <div
          ref={perksRef}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px 20px', marginBottom: 36 }}
        >
          {PERKS.map((p) => (
            <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              <CheckCircle2 style={{ width: 13, height: 13, color: '#6366f1' }} />
              {p}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div
          ref={btnsRef}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}
        >
          <Link
            href="/signup"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: 14, background: '#7c3aed',
              padding: '13px 28px', fontSize: 14, fontWeight: 700,
              color: '#fff', textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(124,58,237,0.5)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(124,58,237,0.35)' }}
          >
            Start for free
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
          <Link
            href="/login"
            style={{
              borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              padding: '13px 28px', fontSize: 14, fontWeight: 500,
              color: 'rgba(255,255,255,0.65)', textDecoration: 'none',
              backdropFilter: 'blur(8px)', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Scroll pip */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', paddingBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 30, borderRadius: 99, border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4px 0' }}>
            <div style={{ width: 3, height: 6, borderRadius: 2, background: '#6366f1', animation: 'float 1.8s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
