'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Sparkles, ChevronDown } from 'lucide-react'
import api from '@/lib/api'

interface Message { role: 'user' | 'model'; text: string }

export function AiChat() {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const next: Message[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setLoading(true)
    try {
      const history = next.slice(0, -1)
      const { data } = await api.post('/ai/chat', { message: text, history })
      setMessages([...next, { role: 'model', text: data.reply }])
    } catch {
      setMessages([...next, { role: 'model', text: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7c3aed,#6366f1,#4f46e5)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.65)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.5)' }}
          title="Ask AI about your meetings"
        >
          <Sparkles style={{ width: 22, height: 22, color: '#fff' }} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 380, height: 560,
          borderRadius: 20, overflow: 'hidden',
          background: '#0f0f17',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,#7c3aed,#6366f1,#818cf8)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, background: 'rgba(99,102,241,0.15)' }}>
                <Sparkles style={{ width: 14, height: 14, color: '#818cf8' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Mira AI</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: 0 }}>Ask about your meetings</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', transition: 'color 0.1s, background 0.1s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
            >
              <ChevronDown style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles style={{ width: 22, height: 22, color: '#818cf8' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Ask me anything</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                  {[
                    'What was decided in the last meeting?',
                    'What are my open action items?',
                    'Summarize this week\'s meetings',
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus() }}
                      style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 9, fontSize: 12, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.1s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#818cf8' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 13px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  fontSize: 13, lineHeight: 1.6,
                  background: m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)',
                  color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,0.85)',
                  border: m.role === 'model' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ padding: '10px 13px', borderRadius: '14px 14px 14px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  <Loader2 style={{ width: 13, height: 13, color: '#818cf8' }} className="animate-spin" />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask about your meetings…"
              rows={1}
              style={{
                flex: 1, resize: 'none', padding: '9px 12px',
                fontSize: 13, lineHeight: 1.5,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#fff', outline: 'none',
                fontFamily: 'inherit', maxHeight: 100, overflowY: 'auto',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: 'none',
                background: input.trim() && !loading ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.07)',
                color: input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.25)',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: input.trim() && !loading ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
              }}
            >
              <Send style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
