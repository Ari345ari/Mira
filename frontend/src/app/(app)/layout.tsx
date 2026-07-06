'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Sidebar from '@/components/sidebar'
import { SidebarProvider } from '@/components/sidebar-context'
import { AiChat } from '@/components/ai-chat'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!accessToken) router.replace('/login')
  }, [accessToken, router])

  useEffect(() => {
    let x = window.innerWidth / 2, y = window.innerHeight / 2
    let lx = x, ly = y
    let rafId: number

    const onMove = (e: MouseEvent) => { x = e.clientX; y = e.clientY }
    window.addEventListener('mousemove', onMove, { passive: true })

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
    function tick() {
      rafId = requestAnimationFrame(tick)
      lx = lerp(lx, x, 0.08)
      ly = lerp(ly, y, 0.08)
      if (glowRef.current) {
        glowRef.current.style.left = `${lx}px`
        glowRef.current.style.top  = `${ly}px`
      }
    }
    tick()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  if (!accessToken) {
    return (
      <div className="app-bg flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: 'var(--border-hi)', borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="app-bg flex h-screen overflow-hidden" style={{ position: 'relative' }}>
        {/* Cursor glow — follows mouse with lerp */}
        <div
          ref={glowRef}
          style={{
            position: 'fixed', pointerEvents: 'none', zIndex: 9999,
            width: 560, height: 560, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 68%)',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
        <AiChat />
      </div>
    </SidebarProvider>
  )
}
