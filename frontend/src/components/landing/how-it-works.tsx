'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Upload, Cpu, ScrollText } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    num: '01',
    icon: Upload,
    title: 'Drop your recording',
    desc: 'Upload any audio or video file. MP3, WAV, M4A, MP4, WEBM — up to 500 MB. Mira handles the rest.',
    accent: '#8b5cf6',
    pill: 'Upload',
    detail: ['MP3, WAV, M4A', 'MP4, WEBM, MOV', 'Up to 500 MB'],
  },
  {
    num: '02',
    icon: Cpu,
    title: 'Mira processes it',
    desc: 'AI transcribes every word, identifies each speaker, and understands context — in Mongolian, English, or both.',
    accent: '#f59e0b',
    pill: 'Processing',
    detail: ['Speaker diarization', 'Mongolian & English', 'Context understanding'],
  },
  {
    num: '03',
    icon: ScrollText,
    title: 'Receive your protocol',
    desc: 'A structured protocol ready to share: executive summary, decisions, action items with owners and due dates.',
    accent: '#34d399',
    pill: 'Done',
    detail: ['Executive summary', 'Action items + owners', 'Shareable format'],
  },
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const headRef    = useRef<HTMLDivElement>(null)
  const stepsRef   = useRef<(HTMLDivElement | null)[]>([])
  const lineRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: headRef.current, start: 'top 88%' } }
      )

      gsap.fromTo(lineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, ease: 'power2.out',
          scrollTrigger: { trigger: lineRef.current, start: 'top 85%' } }
      )

      stepsRef.current.forEach((el, i) => {
        gsap.fromTo(el,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: i * 0.15,
            scrollTrigger: { trigger: el, start: 'top 88%' } }
        )
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className="relative overflow-hidden bg-[#060310] py-28 px-6">
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-full max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-[#7c3aed]/15 to-transparent" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/5 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Head */}
        <div ref={headRef} className="mb-20 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b5cf6]">How it works</p>
          <h2 className="text-[2.4rem] font-black tracking-tight text-white md:text-[3.2rem]">
            Three steps to clarity
          </h2>
          <p className="mt-4 max-w-md mx-auto text-[1rem] text-[#6b6480]">
            From raw recording to polished protocol in under 60 seconds.
          </p>
        </div>

        {/* Connecting line */}
        <div className="relative hidden md:block mb-0 -mt-4">
          <div
            ref={lineRef}
            className="absolute left-[16.66%] right-[16.66%] top-16 h-px origin-left bg-gradient-to-r from-[#8b5cf6] via-[#f59e0b] to-[#34d399]"
            style={{ transformOrigin: 'left center' }}
          />
        </div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              ref={(el) => { stepsRef.current[i] = el }}
              className="group relative flex flex-col items-center text-center md:items-start md:text-left"
            >
              {/* Icon circle */}
              <div
                className="relative mb-6 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${step.accent}22, ${step.accent}0a)`,
                  border: `1px solid ${step.accent}40`,
                }}
              >
                <step.icon size={20} style={{ color: step.accent }} />
                {/* Step number badge */}
                <span
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black text-white"
                  style={{ background: step.accent }}
                >
                  {i + 1}
                </span>
              </div>

              <h3 className="mb-3 text-[19px] font-bold text-white">{step.title}</h3>
              <p className="mb-5 text-[13px] leading-relaxed text-[#6b6480]">{step.desc}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {step.detail.map((d) => (
                  <span
                    key={d}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: `${step.accent}12`, color: step.accent + 'cc', border: `1px solid ${step.accent}20` }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom highlight */}
        <div className="mt-16 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-8 py-6 text-center">
          <p className="text-[15px] font-semibold text-white">
            Average processing time: <span className="text-[#34d399]">under 60 seconds</span> for a 1-hour meeting
          </p>
          <p className="mt-1.5 text-[13px] text-[#6b6480]">No manual work. No waiting. Just clarity.</p>
        </div>
      </div>
    </section>
  )
}
