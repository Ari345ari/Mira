'use client'

import { useRef, useCallback } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'

interface TiltRowProps {
  children: React.ReactNode
  href: string
  statusColor: string
  glowColor: string
  isLast: boolean
}

export function TiltRow({ children, href, statusColor, glowColor, isLast }: TiltRowProps) {
  const ref     = useRef<HTMLAnchorElement>(null)
  const spotRef = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const ny = (e.clientY - rect.top)  / rect.height - 0.5
    const nx = (e.clientX - rect.left) / rect.width  - 0.5
    gsap.to(ref.current, { rotateX: -ny * 10, rotateY: nx * 10, transformPerspective: 900, scale: 1.018, z: 18, duration: 0.18, ease: 'power2.out', overwrite: true })
    if (spotRef.current) {
      const px = ((e.clientX - rect.left) / rect.width)  * 100
      const py = ((e.clientY - rect.top)  / rect.height) * 100
      spotRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, ${glowColor} 0%, transparent 65%)`
      spotRef.current.style.opacity = '1'
    }
  }, [glowColor])

  const onLeave = useCallback(() => {
    gsap.to(ref.current!, { rotateX: 0, rotateY: 0, scale: 1, z: 0, duration: 0.55, ease: 'elastic.out(1, 0.55)', overwrite: true })
    if (spotRef.current) spotRef.current.style.opacity = '0'
  }, [])

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow =
          `0 12px 40px rgba(0,0,0,0.55), 0 4px 12px ${statusColor}22, inset 0 1px 0 rgba(255,255,255,0.06)`
      }}
      style={{
        display: 'block', textDecoration: 'none',
        transformStyle: 'preserve-3d', willChange: 'transform',
        position: 'relative',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.035)',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div ref={spotRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0, transition: 'opacity 0.2s', borderRadius: 'inherit', zIndex: 0 }} />
      {children}
    </Link>
  )
}
