'use client'

interface DocBlockProps {
  title: string
  children: React.ReactNode
  last?: boolean
  light?: boolean
  number?: number
}

export function DocBlock({ title, children, last = false, light = false, number }: DocBlockProps) {
  return (
    <div style={{
      marginBottom: last ? 0 : 32,
      paddingBottom: last ? 0 : 32,
      borderBottom: last ? 'none' : light ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {number !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 800, color: light ? '#6366f1' : 'rgba(99,102,241,0.7)', width: 20, flexShrink: 0 }}>{number}.</span>
        )}
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: light ? '#6366f1' : 'rgba(99,102,241,0.7)', margin: 0 }}>
          {title}
        </p>
        <div style={{ flex: 1, height: 1, background: light ? '#e5e7eb' : 'rgba(255,255,255,0.04)' }} />
      </div>
      {children}
    </div>
  )
}
