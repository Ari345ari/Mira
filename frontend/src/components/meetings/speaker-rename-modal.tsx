'use client'

import { useState } from 'react'
import { C } from './constants'

interface SpeakerRenameModalProps {
  speaker: string
  displayName: string
  hasCustomName: boolean
  onSave: (name: string) => void
  onClear: () => void
  onClose: () => void
}

export function SpeakerRenameModal({ speaker, displayName, hasCustomName, onSave, onClear, onClose }: SpeakerRenameModalProps) {
  const [input, setInput] = useState(hasCustomName ? displayName : '')

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#181626', borderRadius: 20, padding: 28, width: 360, boxShadow: '0 32px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#818cf8', flexShrink: 0 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.text1, margin: 0, lineHeight: 1.2 }}>{displayName}</p>
            <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Set a display name for this speaker</p>
          </div>
        </div>

        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(input.trim()); if (e.key === 'Escape') onClose() }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
          placeholder="Enter a name"
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: C.text1, outline: 'none', marginBottom: 6, transition: 'border-color 0.15s' }}
        />
        <p style={{ fontSize: 11, color: C.text3, margin: '0 0 18px' }}>Leave blank to reset to auto-name</p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: C.text2 }}>
            Cancel
          </button>
          {hasCustomName && (
            <button onClick={onClear} style={{ padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
              Clear
            </button>
          )}
          <button onClick={() => onSave(input.trim())} style={{ flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: C.accent, border: 'none', color: '#fff' }}>
            Save name
          </button>
        </div>
      </div>
    </div>
  )
}
