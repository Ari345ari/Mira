'use client'

import { useState, useRef, useEffect } from 'react'
import { Building2, Users, Plus, X, Loader2, Mail, ChevronDown, Trash2, Shield, Eye, Edit3, Search } from 'lucide-react'
import {
  useWorkspaces, useCreateWorkspace,
  useWorkspaceMembers, useInviteMember, useRemoveMember, useUpdateMemberRole, useCancelInvite, useSearchUsers,
} from '@/hooks/use-meetings'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

const WS_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444']
function wsColor(name: string) { return WS_COLORS[(name?.charCodeAt(0) ?? 0) % WS_COLORS.length] }
function nameInitial(name: string) { return (name ?? '?').charAt(0).toUpperCase() }
function avatarBg(name: string) { return WS_COLORS[(name?.charCodeAt(0) ?? 0) % WS_COLORS.length] }

const ROLE_CFG = {
  admin:  { label: 'Admin',  icon: Shield,  color: '#818cf8', desc: 'Full access, can manage members' },
  editor: { label: 'Editor', icon: Edit3,   color: '#34d399', desc: 'Can upload and edit recordings' },
  viewer: { label: 'Viewer', icon: Eye,     color: 'rgba(255,255,255,0.4)', desc: 'Can view recordings only' },
}

const C = {
  bg: '#0d0d14', card: '#111118', surface: '#15141f',
  border: 'rgba(255,255,255,0.07)',
  text1: '#f1f0ff', text2: 'rgba(255,255,255,0.65)', text3: 'rgba(255,255,255,0.35)',
  accent: '#6366f1', accentHi: '#818cf8',
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#181626', borderRadius: 20, padding: 32, width: 480, maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CFG[role as keyof typeof ROLE_CFG] ?? ROLE_CFG.viewer
  const Icon = cfg.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>
      <Icon style={{ width: 10, height: 10 }} />
      {cfg.label}
    </span>
  )
}

// ── Manage Members modal ─────────────────────────────────────────────────
function ManageMembersModal({ ws, currentUserId, onClose }: { ws: any; currentUserId: string; onClose: () => void }) {
  const { data: membersData, isLoading } = useWorkspaceMembers(ws.id)
  const inviteMutation     = useInviteMember()
  const removeMutation     = useRemoveMember()
  const roleUpdateMutation = useUpdateMemberRole()
  const cancelInviteMut    = useCancelInvite()

  const [email, setEmail]             = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [role, setRole]               = useState('viewer')
  const [roleMenuFor, setRoleMenuFor] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // membersData is now { members, pending_invites }
  const members        = membersData?.members ?? []
  const pendingInvites = membersData?.pending_invites ?? []

  const myMembership = members.find((m: any) => m.user_id === currentUserId)
  const isAdmin = myMembership?.role === 'admin'

  const { data: searchResults = [] } = useSearchUsers(ws.id, searchQuery)

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectSuggestion(user: any) {
    setSelectedUser(user)
    setEmail(user.email)
    setSearchQuery('')
    setShowSuggestions(false)
  }

  function clearSelection() {
    setSelectedUser(null)
    setEmail('')
    setSearchQuery('')
  }

  async function handleInvite() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    try {
      await inviteMutation.mutateAsync({ workspaceId: ws.id, email: trimmed, role })
      toast.success(`Invite sent to ${trimmed}`)
      setEmail('')
      setSearchQuery('')
      setSelectedUser(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not send invite')
    }
  }

  async function handleRemove(userId: string, name: string) {
    try {
      await removeMutation.mutateAsync({ workspaceId: ws.id, userId })
      toast.success(userId === currentUserId ? 'You left the workspace' : `${name} removed`)
      if (userId === currentUserId) onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not remove member')
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await roleUpdateMutation.mutateAsync({ workspaceId: ws.id, userId, role: newRole })
      toast.success('Role updated')
      setRoleMenuFor(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not update role')
    }
  }

  async function handleCancelInvite(inviteId: string, email: string) {
    try {
      await cancelInviteMut.mutateAsync(inviteId)
      toast.success(`Invite to ${email} cancelled`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not cancel invite')
    }
  }

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: wsColor(ws.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {nameInitial(ws.name)}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: 0 }}>{ws.name}</h2>
          <p style={{ fontSize: 12, color: C.text3, margin: '2px 0 0' }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
            {pendingInvites.length > 0 && ` · ${pendingInvites.length} pending`}
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, padding: 4 }}>
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Invite form */}
      {isAdmin && (
        <div style={{ marginBottom: 24, padding: 18, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, margin: '0 0 12px' }}>Add member</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {/* Search / selected user */}
            <div ref={searchRef} style={{ position: 'relative', flex: 1 }}>
              {selectedUser ? (
                /* Selected user chip */
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 9, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: avatarBg(selectedUser.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {nameInitial(selectedUser.full_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUser.full_name}</p>
                    <p style={{ fontSize: 11, color: C.text3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUser.email}</p>
                  </div>
                  <button onClick={clearSelection} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.text3, display: 'flex', flexShrink: 0 }}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ) : (
                /* Search input */
                <>
                  <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.text3, pointerEvents: 'none' }} />
                  <input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setEmail(e.target.value); setShowSuggestions(true) }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; setShowSuggestions(true) }}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { setShowSuggestions(false); handleInvite() }
                      if (e.key === 'Escape') setShowSuggestions(false)
                    }}
                    placeholder="Search by name or email…"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 33px', borderRadius: 9, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: C.text1, outline: 'none', transition: 'border-color 0.15s' }}
                  />
                  {/* Suggestions dropdown */}
                  {showSuggestions && (searchResults as any[]).length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#14121f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', zIndex: 60, overflow: 'hidden' }}>
                      {(searchResults as any[]).map((u: any) => (
                        <button
                          key={u.id}
                          onMouseDown={e => { e.preventDefault(); selectSuggestion(u) }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: avatarBg(u.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                            {nameInitial(u.full_name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</p>
                            <p style={{ fontSize: 11, color: C.text3, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Role picker */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setRoleMenuFor(roleMenuFor === 'invite' ? null : 'invite')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', height: '100%', borderRadius: 9, fontSize: 13, fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: C.text2, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {ROLE_CFG[role as keyof typeof ROLE_CFG]?.label ?? 'Viewer'}
                <ChevronDown style={{ width: 12, height: 12 }} />
              </button>
              {roleMenuFor === 'invite' && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#14121f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden', minWidth: 180 }}>
                  {Object.entries(ROLE_CFG).map(([key, cfg]) => (
                    <button key={key} onClick={() => { setRole(key); setRoleMenuFor(null) }}
                      style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '9px 12px', background: role === key ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (role !== key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { if (role !== key) e.currentTarget.style.background = 'none' }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                      <span style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{cfg.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleInvite} disabled={!email.trim() || inviteMutation.isPending}
            style={{ width: '100%', padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, background: email.trim() ? C.accent : 'rgba(99,102,241,0.25)', border: 'none', color: '#fff', cursor: email.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            {inviteMutation.isPending ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />Sending…</> : <><Mail style={{ width: 13, height: 13 }} />Send invite</>}
          </button>
          <p style={{ fontSize: 11, color: C.text3, margin: '8px 0 0', textAlign: 'center' }}>
            They'll receive a notification to accept or decline.
          </p>
        </div>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, margin: '0 0 8px' }}>Pending invites</p>
          {pendingInvites.map((inv: any) => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: avatarBg(inv.invitee?.full_name ?? '?'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', opacity: 0.7 }}>
                {nameInitial(inv.invitee?.full_name ?? '?')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.invitee?.full_name ?? inv.invitee?.email}</p>
                <p style={{ fontSize: 11, color: C.text3, margin: '1px 0 0' }}>{inv.invitee?.email} · Awaiting response</p>
              </div>
              <RoleBadge role={inv.role} />
              {isAdmin && (
                <button
                  onClick={() => handleCancelInvite(inv.id, inv.invitee?.email ?? '')}
                  title="Cancel invite"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 7, color: 'rgba(255,255,255,0.2)', flexShrink: 0, display: 'flex', transition: 'color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'none' }}
                >
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active members */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, margin: '0 0 8px' }}>Members</p>
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ height: 11, width: 120, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
                  <div style={{ height: 9, width: 160, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && members.map((m: any) => {
          const isMe = m.user_id === currentUserId
          const isOwner = ws.owner_id === m.user_id
          const displayName = m.user?.full_name ?? m.user?.email ?? 'Unknown'
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: avatarBg(displayName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {nameInitial(displayName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}{isMe && <span style={{ marginLeft: 6, fontSize: 11, color: C.text3 }}>(you)</span>}
                  {isOwner && <span style={{ marginLeft: 6, fontSize: 10, color: '#fbbf24' }}>owner</span>}
                </p>
                <p style={{ fontSize: 11, color: C.text3, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user?.email}</p>
              </div>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {isAdmin && !isOwner ? (
                  <button onClick={() => setRoleMenuFor(roleMenuFor === m.user_id ? null : m.user_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 6 }}
                  >
                    <RoleBadge role={m.role} />
                    <ChevronDown style={{ width: 11, height: 11, color: C.text3 }} />
                  </button>
                ) : (
                  <RoleBadge role={isOwner ? 'admin' : m.role} />
                )}
                {roleMenuFor === m.user_id && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#14121f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden', minWidth: 180 }}>
                    {Object.entries(ROLE_CFG).map(([key, cfg]) => (
                      <button key={key} onClick={() => handleRoleChange(m.user_id, key)}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '9px 12px', background: m.role === key ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => { if (m.role !== key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={e => { if (m.role !== key) e.currentTarget.style.background = 'none' }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                        <span style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{cfg.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {(isAdmin || isMe) && !isOwner && (
                <button onClick={() => handleRemove(m.user_id, displayName)} title={isMe ? 'Leave' : 'Remove'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 7, color: 'rgba(255,255,255,0.2)', flexShrink: 0, display: 'flex', transition: 'color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'none' }}
                >
                  {removeMutation.isPending ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Trash2 style={{ width: 13, height: 13 }} />}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

// ── Create workspace modal ────────────────────────────────────────────────
function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const createWs = useCreateWorkspace()
  const [name, setName] = useState('')

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await createWs.mutateAsync({ name: trimmed })
      toast.success(`Workspace "${trimmed}" created`)
      onClose()
    } catch {
      toast.error('Could not create workspace')
    }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: 0 }}>New workspace</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, padding: 4 }}>
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>
      <p style={{ fontSize: 13, color: C.text3, margin: '0 0 20px' }}>Give your workspace a name — you can change this later.</p>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onClose() }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
        placeholder="e.g. Design Team"
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '11px 14px', borderRadius: 10, fontSize: 14,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
          color: C.text1, outline: 'none', marginBottom: 14, transition: 'border-color 0.15s',
        }}
      />
      {name.trim() && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, marginBottom: 20 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: wsColor(name.trim()), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {nameInitial(name.trim())}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text1, margin: 0 }}>{name.trim()}</p>
            <p style={{ fontSize: 11, color: C.text3, margin: '1px 0 0' }}>{name.trim().toLowerCase().replace(/\s+/g, '-')}</p>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onClose}
          style={{ flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: C.text2 }}
        >Cancel</button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || createWs.isPending}
          style={{ flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default', background: name.trim() ? C.accent : 'rgba(99,102,241,0.3)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
        >
          {createWs.isPending && <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />}
          Create
        </button>
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces()
  const { user } = useAuthStore()
  const [managingWs, setManagingWs] = useState<any | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div style={{ minHeight: '100%', background: C.bg, padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: 0, letterSpacing: '-0.03em' }}>Workspaces</h1>
          <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>Organise recordings and collaborate with your team</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus style={{ width: 14, height: 14 }} />
          New workspace
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.card, padding: 24, height: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ height: 12, width: 100, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
                  <div style={{ height: 9, width: 60, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
                </div>
              </div>
              <div style={{ height: 9, width: 130, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
      )}

      {/* Workspace grid */}
      {!isLoading && workspaces?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {workspaces.map((ws: any) => {
            const memberCount = ws.members?.length ?? 1
            return (
              <div
                key={ws.id}
                style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.card, padding: 22, display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.15s, transform 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: wsColor(ws.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                    {nameInitial(ws.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</p>
                    <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>{ws.slug}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.text3 }}>
                    <Users style={{ width: 12, height: 12 }} />
                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.text3 }}>
                    <Building2 style={{ width: 12, height: 12 }} />
                    {ws.meetings?.length ?? 0} recordings
                  </span>
                </div>
                <button
                  onClick={() => setManagingWs(ws)}
                  style={{ marginTop: 'auto', padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', color: C.accentHi, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                >
                  <Users style={{ width: 13, height: 13 }} />
                  Manage members
                </button>
              </div>
            )
          })}

          {/* Add workspace card */}
          <button
            onClick={() => setShowCreate(true)}
            style={{ borderRadius: 16, border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent', padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', minHeight: 160, transition: 'border-color 0.15s, background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus style={{ width: 16, height: 16, color: C.text3 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.text3 }}>New workspace</span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !workspaces?.length && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 style={{ width: 24, height: 24, color: C.accentHi }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text1, margin: 0 }}>No workspaces yet</p>
          <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>Create a workspace to organise your recordings and invite your team</p>
          <button
            onClick={() => setShowCreate(true)}
            style={{ marginTop: 4, padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          >Create workspace</button>
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
      {managingWs && (
        <ManageMembersModal
          ws={managingWs}
          currentUserId={user?.id ?? ''}
          onClose={() => setManagingWs(null)}
        />
      )}
    </div>
  )
}
