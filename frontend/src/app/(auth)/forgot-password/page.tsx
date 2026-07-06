'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [token,   setToken]   = useState('')
  const [focused, setFocused] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      if (data.token) setToken(data.token)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (token) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
            Reset token ready
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', margin: '6px 0 0' }}>
            Copy the token below, then set your new password.
          </p>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your reset token</p>
          <p style={{ fontSize: 13, color: '#818cf8', margin: 0, wordBreak: 'break-all', fontFamily: 'monospace' }}>{token}</p>
        </div>

        <button
          onClick={() => router.push(`/reset-password?token=${token}`)}
          style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)', border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 8px 32px rgba(99,102,241,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          Set new password <ArrowRight style={{ width: 15, height: 15 }} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
          Forgot password?
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', margin: '6px 0 0' }}>
          Enter your email and we&apos;ll generate a reset token.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: '0.02em' }}>
            EMAIL
          </label>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              display: 'block', width: '100%', boxSizing: 'border-box',
              padding: '12px 14px', fontSize: 14, color: '#fff',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${focused ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, outline: 'none',
              boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.18)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          style={{ position: 'relative', overflow: 'hidden', width: '100%', padding: '13px', fontSize: 14, fontWeight: 800, color: '#fff', background: loading ? 'rgba(99,102,241,0.6)' : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 8px 32px rgba(99,102,241,0.38)', marginTop: 4 }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'Sending…' : <>Get reset token <ArrowRight style={{ width: 15, height: 15 }} /></>}
          </span>
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>
        <Link href="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft style={{ width: 13, height: 13 }} />Back to login
        </Link>
      </p>
    </div>
  )
}
