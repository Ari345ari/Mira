'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const innerRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(innerRef.current,
        { y: 50, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: innerRef.current, start: 'top 85%' } }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-[#060310] py-28 px-6 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Background blobs */}
      <div className="pointer-events-none absolute -left-32 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-600/15 blur-[100px]" />

      <div className="relative mx-auto max-w-3xl text-center" ref={innerRef}>
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-12 md:p-16 backdrop-blur-sm">
          {/* Gradient border glow */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10" />

          <p className="mb-4 text-[11px] uppercase tracking-widest text-indigo-400">Get started today</p>
          <h2 className="mb-4 text-[2.25rem] font-bold tracking-tight text-white md:text-[3rem]">
            Never lose a decision<br className="hidden md:block" /> after a meeting again
          </h2>
          <p className="mb-10 text-[1rem] text-zinc-500">
            Mira is your personal meeting intelligence — built for how you actually work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-8 py-3.5 text-[15px] font-semibold text-white shadow-xl shadow-indigo-900/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-900/50 active:scale-[0.97]"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-[15px] font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-5 text-[12px] text-zinc-600">
            Free tier · No credit card · 5 meetings/month
          </p>
        </div>
      </div>
    </section>
  )
}
