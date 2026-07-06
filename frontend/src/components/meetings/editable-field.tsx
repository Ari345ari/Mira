'use client'

import { useState } from 'react'
import { Pencil, Check, X, SpellCheck } from 'lucide-react'
import { C } from './constants'
import api from '@/lib/api'

type LightVariant = boolean | 'document'

interface EditableFieldProps {
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  meetingId: string
  style?: React.CSSProperties
  light?: LightVariant
}

export function EditableField({ value, onChange, multiline = false, meetingId, style, light = false }: EditableFieldProps) {
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState(value)
  const [checking, setChecking] = useState(false)

  function open()   { setDraft(value); setEditing(true) }
  function commit() { onChange(draft); setEditing(false) }
  function cancel() { setDraft(value); setEditing(false) }

  async function grammarCheck() {
    if (!draft.trim() || checking) return
    setChecking(true)
    try {
      const { data } = await api.post(`/meetings/${meetingId}/protocol/grammar-check`, { text: draft })
      setDraft(data.corrected)
    } catch { /* ignore */ }
    finally { setChecking(false) }
  }

  const isDoc = light === 'document'

  const inputStyle: React.CSSProperties = isDoc
    ? { background: '#f9f9f9', border: '1px solid #aaa', borderRadius: 2, color: '#000', fontFamily: 'inherit', outline: 'none' }
    : light
      ? { background: '#f5f3ff', border: '1.5px solid rgba(99,102,241,0.45)', borderRadius: 6, color: '#1e1b4b', fontFamily: 'inherit', outline: 'none' }
      : { background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: C.text1, fontFamily: 'inherit', outline: 'none' }

  const cancelBtnStyle: React.CSSProperties = (isDoc || light)
    ? { background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.13)', color: '#6b7280' }
    : { background: 'transparent', border: `1px solid ${C.border}`, color: C.text3 }

  const saveBtnStyle: React.CSSProperties = isDoc
    ? { background: 'rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.2)', color: '#1e293b' }
    : { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: light ? '#4f46e5' : C.accentHi }

  const grammarBtnStyle: React.CSSProperties = isDoc
    ? { background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.15)', color: '#555' }
    : { background: light ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.08)', border: `1px solid rgba(251,191,36,${light ? 0.35 : 0.2})`, color: light ? '#b45309' : '#fbbf24' }

  if (editing) {
    return (
      <div style={{ marginTop: 2 }}>
        {multiline ? (
          <textarea
            autoFocus spellCheck value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && cancel()}
            rows={4}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '8px 10px', fontSize: 14, lineHeight: 1.75, ...inputStyle, ...style }}
          />
        ) : (
          <input
            autoFocus spellCheck value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: 14, ...inputStyle, ...style }}
          />
        )}
        <div style={{ display: 'flex', gap: 5, marginTop: 6, justifyContent: 'flex-end' }}>
          <button
            onClick={grammarCheck} disabled={checking}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: checking ? 'default' : 'pointer', opacity: checking ? 0.6 : 1, ...grammarBtnStyle }}
          >
            <SpellCheck style={{ width: 11, height: 11 }} />{checking ? 'Checking…' : 'Grammar'}
          </button>
          <button
            onClick={cancel}
            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', ...cancelBtnStyle }}
          >
            <X style={{ width: 11, height: 11 }} />Cancel
          </button>
          <button
            onClick={commit}
            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', ...saveBtnStyle }}
          >
            <Check style={{ width: 11, height: 11 }} />Save
          </button>
        </div>
      </div>
    )
  }

  const hoverBorder = isDoc ? 'rgba(0,0,0,0.18)' : 'rgba(99,102,241,0.28)'
  const hoverBg     = isDoc ? 'rgba(0,0,0,0.03)' : 'rgba(99,102,241,0.05)'
  const pencilColor = isDoc ? 'rgba(0,0,0,0.25)' : 'rgba(99,102,241,0.4)'

  return (
    <div
      role="button" tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && open()}
      style={{
        cursor: 'text', padding: '2px 4px', margin: '-2px -4px',
        borderRadius: isDoc ? 2 : 6,
        border: '1px solid transparent', transition: 'border-color 0.12s, background 0.12s',
        display: 'inline-flex', alignItems: 'flex-start', gap: 5, width: '100%', ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverBorder
        e.currentTarget.style.background  = hoverBg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.background  = 'transparent'
      }}
    >
      <span style={{ flex: 1 }}>{value}</span>
      <Pencil data-pencil style={{ width: 10, height: 10, color: pencilColor, flexShrink: 0, marginTop: 3, opacity: 0.6 }} />
    </div>
  )
}
