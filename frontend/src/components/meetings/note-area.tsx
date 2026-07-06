'use client'

interface NoteAreaProps {
  value: string
  onChange: (v: string) => void
  light?: boolean
}

export function NoteArea({ value, onChange, light = false }: NoteAreaProps) {
  if (light) {
    return (
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#d97706', margin: '0 0 5px', display: 'flex', alignItems: 'center', gap: 4 }}>
          ✏ Private note
        </p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add a private note for this section (not exported)…"
          rows={value ? Math.max(2, (value.match(/\n/g) || []).length + 2) : 1}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#fffbeb', border: '1px dashed #fcd34d',
            borderRadius: 6, padding: '8px 12px',
            fontSize: 12, lineHeight: 1.6, color: '#78350f',
            resize: 'vertical', outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.15s, background 0.15s', minHeight: 36,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.background = '#fef9c3' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#fcd34d'; e.currentTarget.style.background = '#fffbeb' }}
        />
      </div>
    )
  }

  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(99,102,241,0.55)', margin: '0 0 6px' }}>
        ✏ Notes
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add notes for this section…"
        rows={value ? Math.max(2, (value.match(/\n/g) || []).length + 2) : 2}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(99,102,241,0.03)',
          border: '1px dashed rgba(99,102,241,0.18)',
          borderRadius: 8, padding: '10px 13px',
          fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.7)',
          resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.15s, background 0.15s', minHeight: 52,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.18)'; e.currentTarget.style.background = 'rgba(99,102,241,0.03)' }}
      />
    </div>
  )
}
