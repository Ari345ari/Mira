'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import gsap from 'gsap'

export default function Nav() {
  const navRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.2 }
    )

    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-300 ${
        scrolled
          ? 'bg-[#060410]/90 backdrop-blur-md border-b border-white/[0.06] py-3'
          : 'bg-transparent'
      }`}
    >
      <Link href="/" className="flex items-center gap-2 group">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-900/40 transition-transform group-hover:scale-110">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-[14px] font-semibold text-white tracking-tight">Mira</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {['Features', 'How it works', 'Pricing'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(/ /g, '-')}`}
            className="text-[13px] text-zinc-400 hover:text-white transition-colors duration-200"
          >
            {item}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/login" className="hidden md:block text-[13px] text-zinc-400 hover:text-white transition-colors duration-200">
          Sign in
        </Link>
        <Link
          href="/signup"
          className="group relative overflow-hidden rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-900/30 transition-all hover:bg-indigo-500 active:scale-[0.97]"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          Get started free
        </Link>
      </div>
    </nav>
  )
}
