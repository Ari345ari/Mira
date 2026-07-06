'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useCreateWorkspace } from '@/hooks/use-meetings'
import toast from 'react-hot-toast'
import { Modal, C, wsColor, nameInitial } from './shared'

export function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
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
        autoFocus value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') onClose() }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
        placeholder="e.g. Design Team"
        style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: C.text1, outline: 'none', marginBottom: 14, transition: 'border-color 0.15s' }}
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
        <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: C.text2 }}>Cancel</button>
        <button onClick={handleCreate} disabled={!name.trim() || createWs.isPending}
          style={{ flex: 1, padding: '10px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default', background: name.trim() ? C.accent : 'rgba(99,102,241,0.3)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
        >
          {createWs.isPending && <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />}Create
        </button>
      </div>
    </Modal>
  )
}
