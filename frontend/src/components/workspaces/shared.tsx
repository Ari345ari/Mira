'use client'

import { Shield, Edit3, Eye } from 'lucide-react'

export const WS_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444']
export function wsColor(name: string)    { return WS_COLORS[(name?.charCodeAt(0) ?? 0) % WS_COLORS.length] }
export function nameInitial(name: string){ return (name ?? '?').charAt(0).toUpperCase() }
export function avatarBg(name: string)   { return WS_COLORS[(name?.charCodeAt(0) ?? 0) % WS_COLORS.length] }

export const ROLE_CFG = {
  admin:  { label: 'Admin',  icon: Shield, color: '#818cf8', desc: 'Full access, can manage members' },
  editor: { label: 'Editor', icon: Edit3,  color: '#34d399', desc: 'Can upload and edit recordings' },
  viewer: { label: 'Viewer', icon: Eye,    color: 'rgba(255,255,255,0.4)', desc: 'Can view recordings only' },
}

export const C = {
  bg: '#0d0d14', card: '#111118', surface: '#15141f',
  border: 'rgba(255,255,255,0.07)',
  text1: '#f1f0ff', text2: 'rgba(255,255,255,0.65)', text3: 'rgba(255,255,255,0.35)',
  accent: '#6366f1', accentHi: '#818cf8',
}

export function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#181626', borderRadius: 20, padding: 32, width: 480, maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CFG[role as keyof typeof ROLE_CFG] ?? ROLE_CFG.viewer
  const Icon = cfg.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
      <Icon style={{ width: 10, height: 10 }} />{cfg.label}
    </span>
  )
}
