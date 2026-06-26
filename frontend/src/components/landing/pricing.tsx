'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const PLANS = [
  {
    name: 'Free',
    price: '0',
    period: 'forever',
    desc: 'Perfect for individuals exploring AI meeting intelligence.',
    cta: 'Start free',
    href: '/signup',
    highlight: false,
    features: [
      '5 meetings / month',
      'Up to 60 min per meeting',
      'Mongolian & English STT',
      'AI protocol generation',
      'PDF export',
      '1 workspace',
    ],
  },
  {
    name: 'Pro',
    price: '29',
    period: 'per month',
    desc: 'For teams that run on meetings and need to move fast.',
    cta: 'Get started',
    href: '/signup',
    highlight: true,
    features: [
      'Unlimited meetings',
      'Unlimited recording length',
      'Mongolian & English STT',
      'AI protocol generation',
      'PDF + DOCX export',
      'Up to 10 workspaces',
      'Speaker diarization',
      'Priority processing',
      'Email support',
    ],
  },
]

export default function Pricing() {
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
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', delay: i * 0.15,
            scrollTrigger: { trigger: card, start: 'top 88%' } }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="pricing" className="relative bg-[#070410] py-28 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-4xl">
        <div ref={headRef} className="mb-16 text-center">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-indigo-400">Pricing</p>
          <h2 className="text-[2.25rem] font-bold tracking-tight text-white md:text-[3rem]">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-zinc-500">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              ref={(el) => { cardsRef.current[i] = el }}
              className={`relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? 'border-indigo-500/50 bg-indigo-600/10 hover:border-indigo-500/70'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-[11px] font-semibold text-white shadow-lg shadow-indigo-900/40">
                  Most popular
                </div>
              )}

              {/* Glow for highlighted */}
              {plan.highlight && (
                <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-indigo-500/20 to-transparent opacity-60" />
              )}

              <div className="relative">
                <p className="mb-1 text-[13px] font-medium text-zinc-400">{plan.name}</p>
                <div className="mb-1 flex items-end gap-1.5">
                  <span className="text-[3rem] font-bold leading-none text-white">${plan.price}</span>
                  <span className="mb-2 text-[13px] text-zinc-500">/ {plan.period}</span>
                </div>
                <p className="mb-6 text-[13px] text-zinc-500">{plan.desc}</p>

                <Link
                  href={plan.href}
                  className={`group relative mb-8 flex w-full items-center justify-center overflow-hidden rounded-xl px-4 py-3 text-[14px] font-semibold transition-all active:scale-[0.97] ${
                    plan.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/30'
                      : 'border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
                  }`}
                >
                  {plan.highlight && (
                    <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  )}
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[13px] text-zinc-400">
                      <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-indigo-400' : 'text-zinc-600'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
