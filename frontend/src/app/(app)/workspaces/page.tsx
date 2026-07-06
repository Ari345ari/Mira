'use client'

import { useState } from 'react'
import { Building2, Users, Plus } from 'lucide-react'
import { useWorkspaces } from '@/hooks/use-meetings'
import { useAuthStore } from '@/store/auth'
import { C, wsColor, nameInitial } from '@/components/workspaces/shared'
import { ManageMembersModal } from '@/components/workspaces/manage-members-modal'
import { CreateWorkspaceModal } from '@/components/workspaces/create-workspace-modal'

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces()
  const { user }                        = useAuthStore()
  const [managingWs, setManagingWs]     = useState<any | null>(null)
  const [showCreate, setShowCreate]     = useState(false)

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
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Plus style={{ width: 14, height: 14 }} />New workspace
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.card, padding: 24, height: 140 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ height: 12, width: 100, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
                  <div style={{ height: 9,  width: 60,  borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
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
              <div key={ws.id}
                style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.card, padding: 22, display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.15s, transform 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.transform = 'none' }}
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
                    <Users style={{ width: 12, height: 12 }} />{memberCount} member{memberCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.text3 }}>
                    <Building2 style={{ width: 12, height: 12 }} />{ws.meetings?.length ?? 0} recordings
                  </span>
                </div>
                <button onClick={() => setManagingWs(ws)}
                  style={{ marginTop: 'auto', padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', color: C.accentHi, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.14)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                >
                  <Users style={{ width: 13, height: 13 }} />Manage members
                </button>
              </div>
            )
          })}

          <button onClick={() => setShowCreate(true)}
            style={{ borderRadius: 16, border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent', padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', minHeight: 160, transition: 'border-color 0.15s, background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'transparent' }}
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
          <button onClick={() => setShowCreate(true)}
            style={{ marginTop: 4, padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          >Create workspace</button>
        </div>
      )}

      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
      {managingWs && <ManageMembersModal ws={managingWs} currentUserId={user?.id ?? ''} onClose={() => setManagingWs(null)} />}
    </div>
  )
}
