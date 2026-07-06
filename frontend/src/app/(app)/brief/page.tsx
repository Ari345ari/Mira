'use client'

import { useState } from 'react'
import { Sparkles, Loader2, RotateCcw, Copy, Check } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'
import { C } from '@/components/meetings/constants'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const EXAMPLES = [
  'Weekly product sync — review sprint progress, discuss blockers, plan next sprint',
  'Q4 budget review — align on headcount, software spend, and marketing allocation',
  'Client onboarding kickoff — introductions, project timeline, success metrics',
]

function renderBrief(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return <div key={i} style={{ height: 8 }} />

    // Bold headers: **text** or ## text
    if (trimmed.startsWith('##') || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
      const label = trimmed.replace(/^##\s*/, '').replace(/^\*\*|\*\*$/g, '')
      return (
        <p key={i} style={{ fontSize: 12, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 8px' }}>
          {label}
        </p>
      )
    }

    // Bold inline: process **word** within line
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const content = trimmed.replace(/^[-•]\s*/, '')
      return (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <span style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }}>·</span>
          <p style={{ fontSize: 13, color: C.text2, margin: 0, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }} />
        </div>
      )
    }

    return (
      <p key={i} style={{ fontSize: 13, color: C.text2, margin: '0 0 6px', lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>') }} />
    )
  })
}

export default function BriefPage() {
  const { activeWsId } = useWorkspaceStore()
  const [agenda, setAgenda]   = useState('')
  const [brief, setBrief]     = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  async function generate() {
    if (!agenda.trim()) return
    setLoading(true)
    setBrief('')
    try {
      const { data } = await api.post('/ai/brief', {
        agenda: agenda.trim(),
        workspace_id: activeWsId ?? undefined,
      })
      setBrief(data.brief)
    } catch {
      toast.error('Failed to generate brief. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function copyBrief() {
    navigator.clipboard.writeText(brief).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: 16, height: 16, color: '#818cf8' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text1, margin: 0, letterSpacing: '-0.03em' }}>Pre-meeting Brief</h1>
        </div>
        <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
          Paste your meeting agenda — Mira searches your past meetings and tells you everything you need to know before walking in.
        </p>
      </div>

      {/* Input card */}
      <div style={{ borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Meeting agenda</p>
          <textarea
            value={agenda}
            onChange={e => setAgenda(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate() }}
            placeholder="e.g. Weekly product sync — review sprint progress, discuss blockers, plan next sprint goals and priorities"
            rows={4}
            style={{ width: '100%', resize: 'none', background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: C.text1, lineHeight: 1.65, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        {/* Example suggestions */}
        {!agenda && (
          <div style={{ padding: '10px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.text3, marginRight: 4, alignSelf: 'center' }}>Try:</span>
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => setAgenda(ex)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text3, cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; e.currentTarget.style.color = '#818cf8' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text3 }}>
                {ex.split('—')[0].trim()}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: C.text3 }}>⌘ + Enter to generate</span>
          <button
            onClick={generate}
            disabled={!agenda.trim() || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800, background: agenda.trim() && !loading ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.07)', color: agenda.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.25)', border: 'none', cursor: agenda.trim() && !loading ? 'pointer' : 'default', boxShadow: agenda.trim() && !loading ? '0 4px 14px rgba(99,102,241,0.35)' : 'none', transition: 'all 0.15s' }}
          >
            {loading
              ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />Generating…</>
              : <><Sparkles style={{ width: 13, height: 13 }} />Generate brief</>}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[80, 60, 100, 70, 90, 50].map((w, i) => (
            <div key={i} style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.07)', width: `${w}%`, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
          <p style={{ fontSize: 12, color: C.text3, margin: '8px 0 0', textAlign: 'center' }}>
            Searching your meeting history…
          </p>
        </div>
      )}

      {/* Brief output */}
      {brief && !loading && (
        <div style={{ borderRadius: 16, background: C.card, border: `1px solid rgba(99,102,241,0.2)`, overflow: 'hidden' }}>
          {/* Gradient top bar */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,#7c3aed,#6366f1,#818cf8)' }} />

          {/* Brief header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles style={{ width: 14, height: 14, color: '#818cf8' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>Pre-meeting Brief</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyBrief}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: copied ? '#34d399' : C.text3, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border }}>
                {copied ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={() => { setBrief(''); generate() }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text3, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border }}>
                <RotateCcw style={{ width: 11, height: 11 }} />Regenerate
              </button>
            </div>
          </div>

          {/* Brief content */}
          <div style={{ padding: '20px 24px' }}>
            {renderBrief(brief)}
          </div>
        </div>
      )}
    </div>
  )
}
