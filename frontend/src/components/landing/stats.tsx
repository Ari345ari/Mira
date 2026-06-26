'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { value: 98,  suffix: '%',   label: 'Transcription accuracy',    accent: '#8b5cf6' },
  { value: 60,  suffix: 's',   label: 'Average processing time',   accent: '#f59e0b' },
  { value: 10,  suffix: 'x',   label: 'Faster than manual notes',  accent: '#34d399' },
  { value: 2,   suffix: '',    label: 'Languages natively',         accent: '#8b5cf6' },
]

const TICKER = [
  'Mongolian STT', 'English STT', 'Speaker ID', 'AI Summarization',
  'Action Items', 'Key Decisions', 'Open Questions', 'PDF Export',
  'Mongolian STT', 'English STT', 'Speaker ID', 'AI Summarization',
  'Action Items', 'Key Decisions', 'Open Questions', 'PDF Export',
]

export default function Stats() {
  const sectionRef = useRef<HTMLElement>(null)
  const statRefs   = useRef<(HTMLDivElement | null)[]>([])
  const numRefs    = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      statRefs.current.forEach((el, i) => {
        const target = { val: 0 }
        const finalVal = STATS[i].value

        gsap.fromTo(el,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: i * 0.1,
            scrollTrigger: { trigger: el, start: 'top 88%',
              onEnter: () => {
                gsap.to(target, {
                  val: finalVal, duration: 1.5, ease: 'power2.out',
                  onUpdate: () => {
                    if (numRefs.current[i])
                      numRefs.current[i]!.textContent = Math.round(target.val).toString()
                  },
                })
              },
            },
          }
        )
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-[#07040f] py-24 px-6">
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-full max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-[#7c3aed]/15 to-transparent" />

      {/* Ticker */}
      <div className="mb-20 overflow-hidden">
        <div className="flex animate-[ticker_20s_linear_infinite] whitespace-nowrap">
          {TICKER.map((item, i) => (
            <span key={i} className="mx-6 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#3a3050]">
              <span className="h-1 w-1 rounded-full bg-[#7c3aed]/40" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={i}
              ref={(el) => { statRefs.current[i] = el }}
              className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-7 text-center transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <p className="mb-1 text-[3rem] font-black leading-none tracking-tight text-white md:text-[3.5rem]">
                <span ref={(el) => { numRefs.current[i] = el }}>0</span>
                <span style={{ color: s.accent }}>{s.suffix}</span>
              </p>
              <p className="text-[12px] text-[#6b6480]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
