'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [token,    setToken]    = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [focused,  setFocused]  = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      toast.success('Password updated! Please sign in.')
      router.replace('/login')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(typeof msg === 'string' ? msg : 'Invalid or expired reset token.')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = (name: string): React.CSSProperties => ({
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', fontSize: 14, color: '#fff',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${focused === name ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, outline: 'none',
    boxShadow: focused === name ? '0 0 0 3px rgba(99,102,241,0.18)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  })

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
          Set new password
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', margin: '6px 0 0' }}>
          Paste your reset token and choose a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Token */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: '0.02em' }}>
            RESET TOKEN
          </label>
          <input
            required value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token from previous step"
            onFocus={() => setFocused('token')}
            onBlur={() => setFocused(null)}
            style={{ ...fieldStyle('token'), fontFamily: 'monospace', fontSize: 12 }}
          />
        </div>

        {/* New password */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: '0.02em' }}>
            NEW PASSWORD
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'} required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              onFocus={() => setFocused('pw')}
              onBlur={() => setFocused(null)}
              style={{ ...fieldStyle('pw'), paddingRight: 42 }}
            />
            <button
              type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
            </button>
          </div>
        </div>

        {/* Confirm */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: '0.02em' }}>
            CONFIRM PASSWORD
          </label>
          <input
            type={showPw ? 'text' : 'password'} required value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            onFocus={() => setFocused('confirm')}
            onBlur={() => setFocused(null)}
            style={fieldStyle('confirm')}
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
            {loading ? 'Updating…' : <>Update password <ArrowRight style={{ width: 15, height: 15 }} /></>}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
