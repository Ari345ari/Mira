'use client'

import { useState } from 'react'

interface TipProps {
  text: string
  children: React.ReactNode
  align?: 'center' | 'left' | 'right'
  pos?: 'above' | 'below'
  width?: number
  style?: React.CSSProperties
}

export function Tip({ text, children, align = 'center', pos = 'above', width = 230, style }: TipProps) {
  const [show, setShow] = useState(false)

  const hPos: React.CSSProperties =
    align === 'right' ? { right: 0 } :
    align === 'left'  ? { left: 0 } :
    { left: '50%', transform: 'translateX(-50%)' }

  const vPos: React.CSSProperties =
    pos === 'below' ? { top: 'calc(100% + 8px)' } : { bottom: 'calc(100% + 8px)' }

  const arrowH: React.CSSProperties =
    align === 'right' ? { right: 10 } :
    align === 'left'  ? { left: 10 } :
    { left: '50%', transform: 'translateX(-50%)' }

  const arrowDir: React.CSSProperties =
    pos === 'below'
      ? { bottom: '100%', borderBottom: '5px solid #181626', borderTop: 'none' }
      : { top: '100%', borderTop: '5px solid #181626', borderBottom: 'none' }

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={{
          position: 'absolute', ...vPos, ...hPos, zIndex: 9999,
          width, background: '#181626', color: 'rgba(255,255,255,0.88)',
          fontSize: 12, lineHeight: 1.6, padding: '9px 12px', borderRadius: 9,
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          pointerEvents: 'none', whiteSpace: 'normal',
        }}>
          {text}
          <span style={{
            position: 'absolute', ...arrowH,
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            ...arrowDir,
          }} />
        </span>
      )}
    </span>
  )
}
