'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Mic, Settings, LogOut, Plus,
  ChevronLeft, ChevronRight, ChevronDown, Check,
  Bell, Folder, FolderOpen, CheckSquare, Sparkles, LayoutTemplate,
} from 'lucide-react'
import { SidebarNotifications } from './sidebar-notifications'
import { useAuthStore } from '@/store/auth'
import { useWorkspaceStore } from '@/store/workspace'
import { useSidebar } from './sidebar-context'
import { useWorkspaces, useMyInvites, useRespondToInvite } from '@/hooks/use-meetings'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/meetings',  label: 'Recordings', icon: Mic             },
  { href: '/projects',  label: 'Projects',   icon: FolderOpen      },
  { href: '/actions',   label: 'Action Items',     icon: CheckSquare   },
  { href: '/brief',     label: 'Pre-meeting Brief', icon: Sparkles  },
  { href: '/templates', label: 'Templates',        icon: LayoutTemplate },
  { href: '/files',     label: 'Files',            icon: Folder        },
  { href: '/settings',  label: 'Settings',         icon: Settings      },
]

const WS_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444']
function wsColor(name: string) { return WS_COLORS[(name?.charCodeAt(0) ?? 0) % WS_COLORS.length] }
function wsInitial(name: string) { return (name ?? '?').charAt(0).toUpperCase() }


function Mark() {
  const bars = [
    { x: 0,  y: 8, h: 4,  op: 0.4, delay: '0.35s', dur: '1.05s' },
    { x: 4,  y: 5, h: 10, op: 0.6, delay: '0.15s', dur: '0.85s' },
    { x: 8,  y: 1, h: 18, op: 1.0, delay: '0s',    dur: '0.95s' },
    { x: 12, y: 5, h: 10, op: 0.6, delay: '0.25s', dur: '0.80s' },
    { x: 16, y: 8, h: 4,  op: 0.4, delay: '0.45s', dur: '1.0s'  },
  ]
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width="2.5" height={b.h} rx="1.25"
          fill="currentColor" opacity={b.op}
          style={{ transformOrigin: '50% 100%', animation: `waveBar ${b.dur} ease-in-out infinite`, animationDelay: b.delay }}
        />
      ))}
    </svg>
  )
}

export default function Sidebar() {
  const pathname    = usePathname()
  const router      = useRouter()
  const { user, clearAuth } = useAuthStore()
  const { collapsed, toggle } = useSidebar()

  // Workspaces
  const { data: workspaces, isLoading: wsLoading } = useWorkspaces()
  const { activeWsId, setActiveWsId } = useWorkspaceStore()
  const [wsOpen, setWsOpen] = useState(false)
  const wsRef = useRef<HTMLDivElement>(null)
  const currentWs = workspaces?.find((w: { id: string }) => w.id === activeWsId) ?? workspaces?.[0]

  // Invites / notifications
  const { data: invites } = useMyInvites()
  const respondMutation   = useRespondToInvite()
  const [notifOpen, setNotifOpen] = useState(false)
  const [responding, setResponding] = useState<string | null>(null)
  const pendingCount = invites?.length ?? 0

  // Close workspace dropdown on outside click
  useEffect(() => {
    if (!wsOpen) return
    const h = (e: MouseEvent) => { if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false) }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [wsOpen])

  async function handleRespond(inviteId: string, action: 'accept' | 'decline', wsName: string) {
    setResponding(inviteId)
    try {
      await respondMutation.mutateAsync({ inviteId, action })
      toast.success(action === 'accept' ? `Joined ${wsName}!` : `Declined invite to ${wsName}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Something went wrong')
    } finally {
      setResponding(null)
    }
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <aside style={{
        width: collapsed ? 56 : 216, flexShrink: 0, height: '100%',
        display: 'flex', flexDirection: 'column',
        background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,0.05)',
        transition: 'width 0.2s ease', overflow: 'hidden', position: 'relative', zIndex: 10,
      }}>

        {/* Logo + collapse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', minWidth: 0 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span style={{ color: '#6366f1', display: 'flex', flexShrink: 0 }}><Mark /></span>
            {!collapsed && <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', whiteSpace: 'nowrap' }}>mira</span>}
          </Link>
          <button
            onClick={toggle}
            title={collapsed ? 'Expand' : 'Collapse'}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.color = '#818cf8' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
          >
            {collapsed ? <ChevronRight style={{ width: 13, height: 13 }} /> : <ChevronLeft style={{ width: 13, height: 13 }} />}
          </button>
        </div>

        {/* Workspace switcher */}
        <div ref={wsRef} style={{ padding: '8px 8px 4px', position: 'relative' }}>
          <button
            onClick={() => setWsOpen(o => !o)}
            title={collapsed ? (currentWs?.name ?? 'Workspace') : undefined}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '6px 0' : '6px 8px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 9, border: '1px solid transparent', background: wsOpen ? 'rgba(255,255,255,0.06)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = wsOpen ? 'rgba(255,255,255,0.06)' : 'transparent'; e.currentTarget.style.borderColor = wsOpen ? 'rgba(255,255,255,0.06)' : 'transparent' }}
          >
            {wsLoading
              ? <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
              : <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: currentWs ? wsColor(currentWs.name) : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {currentWs ? wsInitial(currentWs.name) : '?'}
                </div>
            }
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {wsLoading
                    ? <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.07)', width: 80 }} />
                    : <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{currentWs?.name ?? 'My Workspace'}</span>
                  }
                </div>
                <ChevronDown style={{ width: 13, height: 13, flexShrink: 0, color: 'rgba(255,255,255,0.3)', transform: wsOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
              </>
            )}
          </button>

          {wsOpen && !collapsed && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 8, right: 8, background: '#14121f', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>
              <div style={{ padding: '6px 6px 2px' }}>
                {workspaces?.map((ws: { id: string; name: string; slug: string }) => {
                  const isCurrent = ws.id === currentWs?.id
                  return (
                    <button key={ws.id} onClick={() => { setActiveWsId(ws.id); setWsOpen(false) }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 8, background: isCurrent ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', cursor: 'pointer', transition: 'background 0.1s', textAlign: 'left' }}
                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'none' }}
                    >
                      <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: wsColor(ws.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                        {wsInitial(ws.name)}
                      </div>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#fff' : 'rgba(255,255,255,0.65)' }}>{ws.name}</span>
                      {isCurrent && <Check style={{ width: 12, height: 12, color: '#818cf8', flexShrink: 0 }} />}
                    </button>
                  )
                })}
                {!workspaces?.length && <p style={{ padding: '8px 10px', fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No workspaces yet</p>}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 6px 6px' }}>
                <Link href="/workspaces" onClick={() => setWsOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#818cf8', textDecoration: 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
                >
                  <Plus style={{ width: 12, height: 12 }} />
                  Create workspace
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', overflow: 'hidden' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} title={collapsed ? label : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '8px 0' : '7px 10px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 8, marginBottom: 1, textDecoration: 'none', fontSize: 13, fontWeight: active ? 500 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.55)', position: 'relative', transition: 'color 0.1s, background 0.1s', background: active ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
              >
                {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: 14, background: '#6366f1', borderRadius: '0 2px 2px 0' }} />}
                <Icon style={{ width: 15, height: 15, flexShrink: 0, color: active ? '#818cf8' : 'rgba(255,255,255,0.45)' }} />
                {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* New recording */}
        <div style={{ padding: '0 8px 8px' }}>
          <Link href="/upload" title={collapsed ? 'New recording' : undefined}
            style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 7, padding: collapsed ? '8px 0' : '8px 10px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, color: '#818cf8', border: '1px dashed rgba(99,102,241,0.35)', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.5)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.35)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <Plus style={{ width: 13, height: 13, flexShrink: 0 }} />
            {!collapsed && <><span style={{ flex: 1 }}>New recording</span><span style={{ fontSize: 11, color: 'rgba(99,102,241,0.7)' }}>⌘N</span></>}
          </Link>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 8px' }} />

        {/* Notification bell */}
        <div style={{ padding: '6px 8px 2px' }}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            title={collapsed ? `Notifications${pendingCount > 0 ? ` (${pendingCount})` : ''}` : undefined}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '7px 0' : '7px 10px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 8, background: notifOpen ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s', position: 'relative' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = notifOpen ? 'rgba(255,255,255,0.06)' : 'transparent')}
          >
            <div style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
              <Bell style={{ width: 15, height: 15, color: pendingCount > 0 ? '#fbbf24' : 'rgba(255,255,255,0.45)' }} />
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 14, height: 14, borderRadius: 99, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid #0d0d14' }}>
                  {pendingCount}
                </span>
              )}
            </div>
            {!collapsed && (
              <>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 400, color: pendingCount > 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)', textAlign: 'left' }}>Notifications</span>
                {pendingCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.15)', borderRadius: 99, padding: '1px 7px' }}>{pendingCount} new</span>
                )}
              </>
            )}
          </button>
        </div>

        {/* User */}
        <div style={{ padding: '4px 8px 12px' }}>
          {collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }} title={user?.full_name ?? ''}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#818cf8' }}>{initials}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6366f1' }}>{initials}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name ?? 'You'}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email ?? ''}</p>
              </div>
              <button
                onClick={() => { router.push('/'); setTimeout(clearAuth, 80) }}
                title="Sign out"
                style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 5, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                <LogOut style={{ width: 12, height: 12 }} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {notifOpen && (
        <SidebarNotifications
          collapsed={collapsed}
          pendingCount={pendingCount}
          invites={invites}
          responding={responding}
          onClose={() => setNotifOpen(false)}
          onRespond={handleRespond}
        />
      )}
    </>
  )
}
