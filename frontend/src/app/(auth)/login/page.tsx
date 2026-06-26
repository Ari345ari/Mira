'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, accessToken } = useAuthStore()
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (accessToken) router.replace('/dashboard')
  }, [accessToken, router])

  // Mouse-track glow on card
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width)  * 100
      const y = ((e.clientY - rect.top)  / rect.height) * 100
      card.style.setProperty('--mx', `${x}%`)
      card.style.setProperty('--my', `${y}%`)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [focused,  setFocused]  = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.user, data.access_token)
      toast.success('Welcome back!')
      router.replace('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Invalid email or password'
      setError(typeof msg === 'string' ? msg : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={cardRef} style={{ position: 'relative' }}>
      {/* Heading */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', margin: '6px 0 0' }}>
          Sign in to continue to Mira
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: '0.02em' }}>
            EMAIL
          </label>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            style={{
              display: 'block', width: '100%', boxSizing: 'border-box',
              padding: '12px 14px', fontSize: 14, color: '#fff',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${focused === 'email' ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, outline: 'none',
              boxShadow: focused === 'email' ? '0 0 0 3px rgba(99,102,241,0.18), inset 0 0 20px rgba(99,102,241,0.04)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />
        </div>

        {/* Password */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6, letterSpacing: '0.02em' }}>
            PASSWORD
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'} required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onFocus={() => setFocused('pw')}
              onBlur={() => setFocused(null)}
              style={{
                display: 'block', width: '100%', boxSizing: 'border-box',
                padding: '12px 42px 12px 14px', fontSize: 14, color: '#fff',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${focused === 'pw' ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10, outline: 'none',
                boxShadow: focused === 'pw' ? '0 0 0 3px rgba(99,102,241,0.18), inset 0 0 20px rgba(99,102,241,0.04)' : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
            <button
              type="button" onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', padding: 4, transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171',
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          style={{
            position: 'relative', overflow: 'hidden',
            width: '100%', padding: '13px',
            fontSize: 14, fontWeight: 800, color: '#fff',
            background: loading ? 'rgba(99,102,241,0.6)' : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)',
            border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 32px rgba(99,102,241,0.38)',
            transition: 'transform 0.1s, box-shadow 0.2s, opacity 0.15s',
            marginTop: 4,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.55)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.38)'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
        >
          {/* Shimmer overlay */}
          <span style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2.2s linear infinite',
            pointerEvents: 'none',
          }} />
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <>
                <svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="10" />
                </svg>
                Signing in…
              </>
            ) : (
              <>Sign in <ArrowRight style={{ width: 15, height: 15 }} /></>
            )}
          </span>
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#818cf8')}
        >
          Sign up free
        </Link>
      </p>
    </div>
  )
}
