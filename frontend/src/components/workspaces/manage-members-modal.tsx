'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Mail, ChevronDown, Trash2, Loader2, Search } from 'lucide-react'
import { useWorkspaceMembers, useInviteMember, useRemoveMember, useUpdateMemberRole, useCancelInvite, useSearchUsers } from '@/hooks/use-meetings'
import toast from 'react-hot-toast'
import { Modal, RoleBadge, ROLE_CFG, C, wsColor, nameInitial, avatarBg } from './shared'

interface Props {
  ws: any
  currentUserId: string
  onClose: () => void
}

export function ManageMembersModal({ ws, currentUserId, onClose }: Props) {
  const { data: membersData, isLoading } = useWorkspaceMembers(ws.id)
  const inviteMutation     = useInviteMember()
  const removeMutation     = useRemoveMember()
  const roleUpdateMutation = useUpdateMemberRole()
  const cancelInviteMut    = useCancelInvite()

  const [email, setEmail]               = useState('')
  const [searchQuery, setSearchQuery]   = useState('')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [role, setRole]                 = useState('viewer')
  const [roleMenuFor, setRoleMenuFor]   = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const members        = membersData?.members        ?? []
  const pendingInvites = membersData?.pending_invites ?? []
  const myMembership   = members.find((m: any) => m.user_id === currentUserId)
  const isAdmin        = myMembership?.role === 'admin'

  const { data: searchResults = [] } = useSearchUsers(ws.id, searchQuery)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectSuggestion(user: any) { setSelectedUser(user); setEmail(user.email); setSearchQuery(''); setShowSuggestions(false) }
  function clearSelection()             { setSelectedUser(null); setEmail(''); setSearchQuery('') }

  async function handleInvite() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    try {
      await inviteMutation.mutateAsync({ workspaceId: ws.id, email: trimmed, role })
      toast.success(`Invite sent to ${trimmed}`)
      setEmail(''); setSearchQuery(''); setSelectedUser(null)
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

  async function handleCancelInvite(inviteId: string, invEmail: string) {
    try {
      await cancelInviteMut.mutateAsync(inviteId)
      toast.success(`Invite to ${invEmail} cancelled`)
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
            {members.length} member{members.length !== 1 ? 's' : ''}{pendingInvites.length > 0 && ` · ${pendingInvites.length} pending`}
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
            <div ref={searchRef} style={{ position: 'relative', flex: 1 }}>
              {selectedUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 9, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: avatarBg(selectedUser.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{nameInitial(selectedUser.full_name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUser.full_name}</p>
                    <p style={{ fontSize: 11, color: C.text3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUser.email}</p>
                  </div>
                  <button onClick={clearSelection} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.text3, display: 'flex', flexShrink: 0 }}><X style={{ width: 13, height: 13 }} /></button>
                </div>
              ) : (
                <>
                  <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.text3, pointerEvents: 'none' }} />
                  <input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setEmail(e.target.value); setShowSuggestions(true) }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; setShowSuggestions(true) }}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setShowSuggestions(false); handleInvite() } if (e.key === 'Escape') setShowSuggestions(false) }}
                    placeholder="Search by name or email…"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 33px', borderRadius: 9, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: C.text1, outline: 'none', transition: 'border-color 0.15s' }}
                  />
                  {showSuggestions && (searchResults as any[]).length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#14121f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', zIndex: 60, overflow: 'hidden' }}>
                      {(searchResults as any[]).map((u: any) => (
                        <button key={u.id} onMouseDown={(e) => { e.preventDefault(); selectSuggestion(u) }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: avatarBg(u.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{nameInitial(u.full_name)}</div>
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
              <button onClick={() => setRoleMenuFor(roleMenuFor === 'invite' ? null : 'invite')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', height: '100%', borderRadius: 9, fontSize: 13, fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: C.text2, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {ROLE_CFG[role as keyof typeof ROLE_CFG]?.label ?? 'Viewer'}<ChevronDown style={{ width: 12, height: 12 }} />
              </button>
              {roleMenuFor === 'invite' && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#14121f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden', minWidth: 180 }}>
                  {Object.entries(ROLE_CFG).map(([key, cfg]) => (
                    <button key={key} onClick={() => { setRole(key); setRoleMenuFor(null) }}
                      style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '9px 12px', background: role === key ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { if (role !== key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={(e) => { if (role !== key) e.currentTarget.style.background = 'none' }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                      <span style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{cfg.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleInvite} disabled={!email.trim() || inviteMutation.isPending}
            style={{ width: '100%', padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, background: email.trim() ? C.accent : 'rgba(99,102,241,0.25)', border: 'none', color: '#fff', cursor: email.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            {inviteMutation.isPending ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />Sending…</> : <><Mail style={{ width: 13, height: 13 }} />Send invite</>}
          </button>
          <p style={{ fontSize: 11, color: C.text3, margin: '8px 0 0', textAlign: 'center' }}>They'll receive a notification to accept or decline.</p>
        </div>
      )}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, margin: '0 0 8px' }}>Pending invites</p>
          {pendingInvites.map((inv: any) => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: avatarBg(inv.invitee?.full_name ?? '?'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', opacity: 0.7 }}>{nameInitial(inv.invitee?.full_name ?? '?')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.invitee?.full_name ?? inv.invitee?.email}</p>
                <p style={{ fontSize: 11, color: C.text3, margin: '1px 0 0' }}>{inv.invitee?.email} · Awaiting response</p>
              </div>
              <RoleBadge role={inv.role} />
              {isAdmin && (
                <button onClick={() => handleCancelInvite(inv.id, inv.invitee?.email ?? '')} title="Cancel invite"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 7, color: 'rgba(255,255,255,0.2)', flexShrink: 0, display: 'flex', transition: 'color 0.15s, background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'none' }}
                ><X style={{ width: 13, height: 13 }} /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active members */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, margin: '0 0 8px' }}>Members</p>
        {isLoading && [1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ height: 11, width: 120, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ height: 9,  width: 160, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
        ))}
        {!isLoading && members.map((m: any) => {
          const isMe      = m.user_id === currentUserId
          const isOwner   = ws.owner_id === m.user_id
          const displayName = m.user?.full_name ?? m.user?.email ?? 'Unknown'
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: avatarBg(displayName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{nameInitial(displayName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}{isMe && <span style={{ marginLeft: 6, fontSize: 11, color: C.text3 }}>(you)</span>}{isOwner && <span style={{ marginLeft: 6, fontSize: 10, color: '#fbbf24' }}>owner</span>}
                </p>
                <p style={{ fontSize: 11, color: C.text3, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user?.email}</p>
              </div>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {isAdmin && !isOwner ? (
                  <button onClick={() => setRoleMenuFor(roleMenuFor === m.user_id ? null : m.user_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 6 }}
                  >
                    <RoleBadge role={m.role} /><ChevronDown style={{ width: 11, height: 11, color: C.text3 }} />
                  </button>
                ) : (
                  <RoleBadge role={isOwner ? 'admin' : m.role} />
                )}
                {roleMenuFor === m.user_id && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#14121f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden', minWidth: 180 }}>
                    {Object.entries(ROLE_CFG).map(([key, cfg]) => (
                      <button key={key} onClick={() => handleRoleChange(m.user_id, key)}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '9px 12px', background: m.role === key ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={(e) => { if (m.role !== key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={(e) => { if (m.role !== key) e.currentTarget.style.background = 'none' }}
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
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'none' }}
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
