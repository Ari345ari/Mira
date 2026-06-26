'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface SidebarCtx {
  collapsed: boolean
  toggle: () => void
}

const Ctx = createContext<SidebarCtx>({ collapsed: false, toggle: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('mira-sidebar')
    if (stored === '1') setCollapsed(true)
  }, [])

  function toggle() {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem('mira-sidebar', next ? '1' : '0')
      return next
    })
  }

  return <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>
}

export const useSidebar = () => useContext(Ctx)
