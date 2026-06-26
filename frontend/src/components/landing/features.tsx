'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Mic, Brain, Zap } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const FEATURES = [
  {
    num: '01',
    icon: Mic,
    title: 'Perfect transcription',
    desc: 'Speech recognition built for Mongolian and English — including mixed-language conversations. Every word, every speaker.',
    color: '#8b5cf6',
    preview: [
      { speaker: 'Ариунжаргал', text: 'Q3-д шинэ кампанит ажлыг эхлүүлцгэе.', time: '0:24' },
      { speaker: 'Batbold', text: "Let's set the budget by Friday.", time: '0:41' },
    ],
    previewType: 'transcript' as const,
  },
  {
    num: '02',
    icon: Brain,
    title: 'AI protocol generation',
    desc: 'Mira analyzes the transcript and writes a structured protocol: summary, key decisions, action items with owners and due dates.',
    color: '#f59e0b',
    preview: [
      { label: 'Summary', val: 'Team approved Q3 campaign with ₮15M budget.' },
      { label: 'Decision', val: 'Launch date set to July 1st.' },
      { label: 'Action item', val: 'Батболд — prepare brief by Friday' },
    ],
    previewType: 'protocol' as const,
  },
  {
    num: '03',
    icon: Zap,
    title: 'Under a minute',
    desc: "No waiting. Upload your recording and get the full protocol back before you've poured your coffee.",
    color: '#34d399',
    preview: [
      { label: 'Upload', pct: 100 },
      { label: 'Transcription', pct: 100 },
      { label: 'Protocol', pct: 100 },
    ],
    previewType: 'progress' as const,
  },
]

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null)
  const headRef    = useRef<HTMLDivElement>(null)
  const cardsRef   = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: headRef.current, start: 'top 88%' } }
      )
      cardsRef.current.forEach((card, i) => {
        gsap.fromTo(card,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: i * 0.13,
            scrollTrigger: { trigger: card, start: 'top 90%' } }
        )
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="features" className="relative bg-[#070410] py-28 px-6">
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-full max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-[#7c3aed]/20 to-transparent" />

      <div className="mx-auto max-w-6xl">
        <div ref={headRef} className="mb-16 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b5cf6]">What Mira does</p>
          <h2 className="text-[2.4rem] font-black tracking-tight text-white md:text-[3.2rem]">
            Built for real meetings
          </h2>
          <p className="mt-4 max-w-lg mx-auto text-[1rem] text-[#6b6480]">
            Not another note-taking app. Mira is a full intelligence layer for your meetings.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.num}
              ref={(el) => { cardsRef.current[i] = el }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-white/[0.12]"
            >
              {/* Background number */}
              <span
                className="pointer-events-none absolute -right-2 -top-4 select-none text-[6rem] font-black leading-none opacity-[0.045]"
                style={{ color: f.color }}
              >
                {f.num}
              </span>

              {/* Icon */}
              <div
                className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${f.color}18`, border: `1px solid ${f.color}35` }}
              >
                <f.icon size={18} style={{ color: f.color }} />
              </div>

              <h3 className="mb-2.5 text-[17px] font-bold text-white">{f.title}</h3>
              <p className="mb-5 text-[13px] leading-relaxed text-[#6b6480]">{f.desc}</p>

              {/* Preview card */}
              <div className="rounded-xl border border-white/[0.06] bg-[#060410]/60 p-3 space-y-2">
                {f.previewType === 'transcript' && f.preview.map((line: any, j) => (
                  <div key={j} className="flex items-start gap-2.5 rounded-lg bg-white/[0.04] p-2.5">
                    <span className="mt-0.5 w-7 shrink-0 text-[9px] tabular-nums text-[#6b6480]">{line.time}</span>
                    <div>
                      <p className="text-[9px] font-bold text-[#a78bfa]">{line.speaker}</p>
                      <p className="text-[11px] text-[#8a7fa8]">{line.text}</p>
                    </div>
                  </div>
                ))}
                {f.previewType === 'protocol' && f.preview.map((item: any, j) => (
                  <div key={j} className="rounded-lg bg-white/[0.04] px-2.5 py-2">
                    <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: f.color + 'aa' }}>{item.label}</p>
                    <p className="text-[11px] text-[#8a7fa8]">{item.val}</p>
                  </div>
                ))}
                {f.previewType === 'progress' && (
                  <div className="space-y-2.5 p-1">
                    {f.preview.map((step: any, j) => (
                      <div key={j}>
                        <div className="mb-1 flex justify-between">
                          <span className="text-[10px] text-[#6b6480]">{step.label}</span>
                          <span className="text-[10px] text-[#34d399]">✓</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-[#34d399]" style={{ width: `${step.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="pt-1 text-center text-[11px] font-bold text-[#34d399]">Done in 43 seconds</p>
                  </div>
                )}
              </div>

              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(350px circle at 50% 0%, ${f.color}12, transparent)` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
