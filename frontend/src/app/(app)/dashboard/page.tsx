'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Loader2, ArrowUpRight, Upload, Mic, CheckCircle2, Clock3 } from 'lucide-react'
import { useMeetings, useWorkspaces } from '@/hooks/use-meetings'
import { useAuthStore } from '@/store/auth'
import { useWorkspaceStore } from '@/store/workspace'
import { MeetingStatus } from '@/types'
import { gsap } from 'gsap'
import { fmtDur, dateLabel } from '@/lib/format'
import { Tip } from '@/components/ui/tip'
import { StatusDot, HealthRing, WaveDecor, TiltCard, MagneticWrap, AuroraOrb } from '@/components/dashboard/widgets'

export default function DashboardPage() {
  const { user }                        = useAuthStore()
  const { activeWsId, setActiveWsId }   = useWorkspaceStore()
  const { data: workspaces, isLoading: wsLoading } = useWorkspaces()
  const filterWsId  = activeWsId ?? workspaces?.[0]?.id
  const { data: meetings = [], isLoading: meetingsLoading } = useMeetings(filterWsId)
  const isLoading   = wsLoading || meetingsLoading || !filterWsId

  useEffect(() => {
    if (!activeWsId && filterWsId) setActiveWsId(filterWsId)
  }, [activeWsId, filterWsId, setActiveWsId])

  const pageRef     = useRef<HTMLDivElement>(null)
  const heroRef     = useRef<HTMLDivElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const statsRef    = useRef<HTMLDivElement>(null)
  const listRef     = useRef<HTMLDivElement>(null)

  const done       = meetings.filter((m: any) => m.status === MeetingStatus.DONE).length
  const processing = meetings.filter((m: any) => ![MeetingStatus.DONE, MeetingStatus.FAILED].includes(m.status)).length
  const total      = meetings.length
  const healthPct  = total ? done / total : 0
  const pct        = total ? Math.round(done / total * 100) : 0

  const recent = [...meetings]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  const [nums, setNums]             = useState({ done: 0, processing: 0, total: 0 })
  const [greeting, setGreeting]     = useState('')
  const [typingDone, setTypingDone] = useState(false)

  // Typewriter greeting
  useEffect(() => {
    if (!user?.full_name) return
    const firstName = user.full_name.split(' ')[0]
    const hour = new Date().getHours()
    const sal  = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
    const full = `${sal}, ${firstName}!`
    let i = 0; setGreeting(''); setTypingDone(false)
    const iv = setInterval(() => {
      i++; setGreeting(full.slice(0, i))
      if (i >= full.length) { clearInterval(iv); setTimeout(() => setTypingDone(true), 700) }
    }, 36)
    return () => clearInterval(iv)
  }, [user?.full_name])

  // Counter animation
  useEffect(() => {
    if (isLoading) return
    const obj = { d: 0, p: 0, t: 0 }
    gsap.to(obj, {
      d: done, p: processing, t: total, duration: 1.5, ease: 'power3.out',
      onUpdate() { setNums({ done: Math.round(obj.d), processing: Math.round(obj.p), total: Math.round(obj.t) }) },
    })
  }, [done, processing, total, isLoading])

  // Entrance animations
  useEffect(() => {
    if (isLoading) return
    gsap.fromTo(heroRef.current,  { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' })
    gsap.fromTo(statsRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7,  ease: 'power3.out', delay: 0.2 })
  }, [isLoading])

  // Row stagger
  useEffect(() => {
    if (!listRef.current || isLoading || !recent.length) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.rec-row', { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.38, stagger: 0.055, ease: 'power2.out', delay: 0.38 })
    }, listRef)
    return () => ctx.revert()
  }, [isLoading, recent.length])

  // Mouse parallax for aurora orbs
  useEffect(() => {
    const el = pageRef.current
    if (!el) return
    let rafId: number, tx = 0, ty = 0, lx = 0, ly = 0
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width  - 0.5) * 18
      ty = ((e.clientY - r.top)  / r.height - 0.5) * 10
    }
    const tick = () => {
      rafId = requestAnimationFrame(tick)
      lx += (tx - lx) * 0.04; ly += (ty - ly) * 0.04
      if (parallaxRef.current) parallaxRef.current.style.transform = `translate(${lx * 0.38}px, ${ly * 0.38}px)`
    }
    el.addEventListener('mousemove', onMove, { passive: true })
    tick()
    return () => { cancelAnimationFrame(rafId); el.removeEventListener('mousemove', onMove) }
  }, [])

  return (
    <div ref={pageRef} style={{ minHeight: '100%', overflow: 'hidden' }}>

      {/* ── AURORA HERO ─────────────────────────────────────────── */}
      <section className="noise" style={{ position: 'relative', padding: '52px 56px 48px', overflow: 'hidden', minHeight: 220 }}>
        <AuroraOrb color="radial-gradient(circle, rgba(99,102,241,0.32) 0%, transparent 70%)"  size={540} top={-140} right={-90}  animation="aurora1 22s" />
        <AuroraOrb color="radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)"   size={340} top={50}   right={170}  animation="aurora2 28s" delay="-8s" />
        <AuroraOrb color="radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)"  size={280} bottom={-60} left={80}  animation="aurora3 20s" delay="-14s" />
        <AuroraOrb color="radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)"   size={320} bottom={20} right={300} animation="aurora1 32s" delay="-5s" />

        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)' }} />
        <WaveDecor />

        <div ref={parallaxRef} style={{ position: 'relative', zIndex: 2 }}>
          <div ref={heroRef} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', maxWidth: 820 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: '0 0 10px', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>
                {format(new Date(), 'EEEE, MMMM d · yyyy')}
              </p>
              <h1 style={{ fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {greeting || (user?.full_name ? `Welcome, ${user.full_name.split(' ')[0]}` : 'Welcome back')}
                {greeting && !typingDone && <span style={{ WebkitTextFillColor: '#6366f1', fontWeight: 300, marginLeft: 1, opacity: 0.9 }}>|</span>}
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', margin: '11px 0 0', letterSpacing: '0.01em', lineHeight: 1.5 }}>
                {total > 0
                  ? `${done} of ${total} recording${total !== 1 ? 's' : ''} analyzed${processing > 0 ? ` · ${processing} in progress` : ' · all caught up ✓'}`
                  : 'Upload your first recording to get started'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0, marginTop: 4 }}>
              <HealthRing pct={healthPct} />
              <Tip align="right" width={230} text="How many of your recordings have been fully processed by Mira. A 10/10 ring means every file has a complete protocol.">
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase', cursor: 'help' }}>
                  Analysis Rate <span style={{ color: '#818cf8', fontSize: 10 }}>ⓘ</span>
                </span>
              </Tip>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <div style={{ padding: '0 56px 72px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* ── BENTO STATS ─────────────────────────────────────── */}
          <div ref={statsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
            <TiltCard className="glow-border shimmer-sweep" style={{ borderRadius: 20, padding: '24px 26px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Mic style={{ width: 14, height: 14, color: '#818cf8' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(99,102,241,0.6)' }}>Total</span>
              </div>
              <p style={{ fontSize: 52, fontWeight: 900, color: '#818cf8', margin: 0, lineHeight: 1, letterSpacing: '-0.06em', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 40px rgba(99,102,241,0.4)' }}>{nums.total}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: '8px 0 0', fontWeight: 400 }}>recordings</p>
            </TiltCard>

            <TiltCard className="glow-border shimmer-sweep" style={{ borderRadius: 20, padding: '24px 26px', background: processing > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.018)', border: `1px solid ${processing > 0 ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.06)'}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: processing > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${processing > 0 ? 'rgba(245,158,11,0.22)' : 'rgba(255,255,255,0.06)'}` }}>
                  <Clock3 style={{ width: 14, height: 14, color: processing > 0 ? '#fbbf24' : 'rgba(255,255,255,0.25)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {processing > 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px rgba(245,158,11,0.9)', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />}
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: processing > 0 ? 'rgba(245,158,11,0.65)' : 'rgba(255,255,255,0.2)' }}>Processing</span>
                </div>
              </div>
              <p style={{ fontSize: 52, fontWeight: 900, color: processing > 0 ? '#fbbf24' : 'rgba(255,255,255,0.15)', margin: 0, lineHeight: 1, letterSpacing: '-0.06em', fontVariantNumeric: 'tabular-nums', textShadow: processing > 0 ? '0 0 40px rgba(245,158,11,0.5)' : 'none' }}>{nums.processing}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: '8px 0 0', fontWeight: 400 }}>{processing > 0 ? 'in queue' : 'all clear'}</p>
            </TiltCard>

            <TiltCard className="glow-border shimmer-sweep" style={{ borderRadius: 20, padding: '24px 26px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.14)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle2 style={{ width: 14, height: 14, color: '#34d399' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(16,185,129,0.6)' }}>Completed</span>
              </div>
              <p style={{ fontSize: 52, fontWeight: 900, color: '#34d399', margin: 0, lineHeight: 1, letterSpacing: '-0.06em', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 40px rgba(16,185,129,0.45)' }}>{nums.done}</p>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: 0 }}>analyzed</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#34d399', margin: 0 }}>{pct}%</p>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #10b981, #34d399)', boxShadow: '0 0 8px rgba(16,185,129,0.6)', width: `${pct}%`, transition: 'width 1.6s ease' }} />
                </div>
              </div>
            </TiltCard>
          </div>

          {/* ── UPLOAD CTA ──────────────────────────────────────── */}
          <MagneticWrap style={{ marginBottom: 28 }}>
            <Link href="/upload" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px 28px', borderRadius: 20, border: '1px dashed rgba(99,102,241,0.22)', background: 'rgba(99,102,241,0.04)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', textDecoration: 'none', transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(99,102,241,0.48)'; el.style.background = 'rgba(99,102,241,0.09)'; el.style.boxShadow = '0 12px 48px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.06)'; const icon = el.querySelector('.up-icon') as HTMLElement; if (icon) { icon.style.transform = 'translateY(-5px) scale(1.15)'; icon.style.filter = 'drop-shadow(0 8px 12px rgba(99,102,241,0.55))' } }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(99,102,241,0.22)'; el.style.background = 'rgba(99,102,241,0.04)'; el.style.boxShadow = ''; const icon = el.querySelector('.up-icon') as HTMLElement; if (icon) { icon.style.transform = ''; icon.style.filter = '' } }}
            >
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(105deg, transparent 38%, rgba(129,140,248,0.07) 50%, transparent 62%)', backgroundSize: '200% 100%', animation: 'shimmer 3.8s linear infinite' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                <Upload className="up-icon" style={{ width: 19, height: 19, color: '#818cf8', transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), filter 0.28s' }} />
              </div>
              <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.88)', margin: 0, letterSpacing: '-0.01em' }}>Analyze a new recording</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.33)', margin: '3px 0 0' }}>Drop a file or click · supports audio & video · AI analysis in under a minute</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: 11, color: 'rgba(99,102,241,0.6)', fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)', borderRadius: 7, padding: '3px 9px' }}>⌘N</span>
                <ArrowUpRight style={{ width: 14, height: 14, color: 'rgba(99,102,241,0.42)' }} />
              </div>
            </Link>
          </MagneticWrap>

          {/* ── RECENT RECORDINGS ───────────────────────────────── */}
          <div ref={listRef}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.26)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent</span>
              <Link href="/meetings" style={{ fontSize: 11, color: 'rgba(255,255,255,0.36)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.1s', fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.36)')}>
                View all <ArrowUpRight style={{ width: 11, height: 11 }} />
              </Link>
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '52px 0' }}>
                <Loader2 style={{ width: 16, height: 16, color: '#6366f1' }} className="animate-spin" />
              </div>
            ) : recent.length === 0 ? (
              <div style={{ padding: '56px 0', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 18, background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 36, marginBottom: 14, filter: 'grayscale(0.3)' }}>🎙</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: '0 0 6px' }}>No recordings yet</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>Press ⌘N to upload your first one</p>
              </div>
            ) : (
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, overflow: 'hidden', background: 'rgba(18,18,28,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                {recent.map((m: any, i: number) => (
                  <Link key={m.id} href={`/meetings/${m.id}`} className="rec-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', textDecoration: 'none', transition: 'background 0.15s, padding-left 0.15s', position: 'relative' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; e.currentTarget.style.paddingLeft = '26px'; const a = e.currentTarget.querySelector('.ra') as HTMLElement; if (a) { a.style.opacity = '1'; a.style.transform = 'translateX(0)' } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.paddingLeft = '20px'; const a = e.currentTarget.querySelector('.ra') as HTMLElement; if (a) { a.style.opacity = '0'; a.style.transform = 'translateX(-6px)' } }}
                  >
                    <StatusDot status={m.status} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 400, letterSpacing: '-0.01em' }}>{m.title}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {dateLabel(m.meeting_date)}{m.duration_seconds ? ` · ${fmtDur(m.duration_seconds)}` : ''}
                    </span>
                    <span className="ra" style={{ fontSize: 13, color: '#818cf8', flexShrink: 0, opacity: 0, transform: 'translateX(-6px)', transition: 'opacity 0.15s, transform 0.15s', marginLeft: 2 }}>→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
