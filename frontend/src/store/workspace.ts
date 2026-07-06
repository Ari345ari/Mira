'use client'
import { create } from 'zustand'

const KEY = 'mira-active-ws-id'

interface WorkspaceState {
  activeWsId: string | null
  setActiveWsId: (id: string) => void
  clearActiveWs: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  activeWsId: null,
  setActiveWsId: (id) => {
    try { localStorage.setItem(KEY, id) } catch {}
    set({ activeWsId: id })
  },
  clearActiveWs: () => {
    try { localStorage.removeItem(KEY) } catch {}
    set({ activeWsId: null })
  },
}))

// Synchronous init from localStorage — runs before any component renders on the client.
// typeof window guard keeps SSR safe (server renders null, client restores saved value).
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(KEY)
  if (saved) useWorkspaceStore.setState({ activeWsId: saved })
}
