'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TESTIMONIALS = [
  {
    quote: 'We used to spend 30 minutes after every leadership meeting writing up notes. Now Mira does it in under a minute — and the output is better than anything we wrote manually.',
    name: 'Batbold Sukhbaatar',
    role: 'CEO, Erdenet Digital',
    avatar: 'Б',
    color: 'bg-indigo-600',
  },
  {
    quote: 'The Mongolian transcription is shockingly accurate. We tried every other tool and they all failed on our accent. Mira just works — even when our team switches between Mongolian and English mid-sentence.',
    name: 'Nominchimeg Ganbold',
    role: 'Operations Lead, Mobicom',
    avatar: 'Н',
    color: 'bg-violet-600',
  },
  {
    quote: "Action items used to fall through the cracks constantly. Now we export the protocol immediately after every meeting and everyone knows exactly what they're responsible for.",
    name: 'Gantulga Dorj',
    role: 'Product Manager, Tap.mn',
    avatar: 'Г',
    color: 'bg-sky-600',
  },
]

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)
  const headRef    = useRef<HTMLDivElement>(null)
  const cardsRef   = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: headRef.current, start: 'top 85%' } }
      )

      cardsRef.current.forEach((card, i) => {
        gsap.fromTo(card,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', delay: i * 0.12,
            scrollTrigger: { trigger: card, start: 'top 88%' } }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-[#060310] py-28 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-6xl">
        <div ref={headRef} className="mb-16 text-center">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-indigo-400">Testimonials</p>
          <h2 className="text-[2.25rem] font-bold tracking-tight text-white md:text-[3rem]">
            Loved by Mongolian teams
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              ref={(el) => { cardsRef.current[i] = el }}
              className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:-translate-y-1"
            >
              {/* Quote marks */}
              <div className="mb-4 text-[3rem] leading-none text-indigo-500/30 font-serif select-none">&ldquo;</div>

              <p className="mb-6 text-[14px] leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors">
                {t.quote}
              </p>

              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.color} text-[13px] font-bold text-white`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">{t.name}</p>
                  <p className="text-[12px] text-zinc-600">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
