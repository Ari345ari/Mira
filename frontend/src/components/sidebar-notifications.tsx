'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { Bell, X, CheckCheck, XCircle, Loader2, Building2 } from 'lucide-react'

const WS_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444']
function wsColor(name: string)   { return WS_COLORS[(name?.charCodeAt(0) ?? 0) % WS_COLORS.length] }
function wsInitial(name: string) { return (name ?? '?').charAt(0).toUpperCase() }
const ROLE_LABEL: Record<string, string> = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' }

interface Props {
  collapsed: boolean
  pendingCount: number
  invites: any[] | undefined
  responding: string | null
  onClose: () => void
  onRespond: (inviteId: string, action: 'accept' | 'decline', wsName: string) => void
}

export function SidebarNotifications({ collapsed, pendingCount, invites, responding, onClose, onRespond }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={ref} style={{ position: 'fixed', left: collapsed ? 56 : 216, top: 0, bottom: 0, width: 320, background: '#14121f', borderRight: '1px solid rgba(255,255,255,0.08)', zIndex: 300, display: 'flex', flexDirection: 'column', boxShadow: '8px 0 40px rgba(0,0,0,0.4)', transition: 'left 0.2s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell style={{ width: 14, height: 14, color: '#fbbf24' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Notifications</span>
          {pendingCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.15)', borderRadius: 99, padding: '1px 7px' }}>{pendingCount}</span>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, display: 'flex', borderRadius: 6 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
        >
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* Invite list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {!invites?.length && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No pending invites</p>
          </div>
        )}

        {invites?.map((inv: any) => (
          <div key={inv.id} style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: inv.workspace ? wsColor(inv.workspace.name) : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {inv.workspace ? wsInitial(inv.workspace.name) : '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.workspace?.name ?? 'Unknown workspace'}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{inv.workspace?.member_count ?? 0} member{inv.workspace?.member_count !== 1 ? 's' : ''}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {ROLE_LABEL[inv.role] ?? inv.role}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 12px', lineHeight: 1.4 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{inv.inviter?.full_name ?? 'Someone'}</span>
              {' '}invited you to join as{' '}
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{ROLE_LABEL[inv.role] ?? inv.role}</span>
            </p>
            <div style={{ display: 'flex', gap: 7 }}>
              <button
                onClick={() => onRespond(inv.id, 'accept', inv.workspace?.name ?? 'workspace')}
                disabled={responding === inv.id}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#10b981', border: 'none', color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s', opacity: responding === inv.id ? 0.6 : 1 }}
                onMouseEnter={(e) => { if (responding !== inv.id) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = responding === inv.id ? '0.6' : '1' }}
              >
                {responding === inv.id ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <CheckCheck style={{ width: 13, height: 13 }} />}Accept
              </button>
              <button
                onClick={() => onRespond(inv.id, 'decline', inv.workspace?.name ?? 'workspace')}
                disabled={responding === inv.id}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.15s', opacity: responding === inv.id ? 0.6 : 1 }}
                onMouseEnter={(e) => { if (responding !== inv.id) { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#f87171' } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
              >
                <XCircle style={{ width: 13, height: 13 }} />Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/workspaces" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#818cf8', textDecoration: 'none' }}>
          <Building2 style={{ width: 12, height: 12 }} />Manage workspaces
        </Link>
      </div>
    </div>
  )
}
