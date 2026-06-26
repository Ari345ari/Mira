'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import api from '@/lib/api'

export default function SignupPage() {
  const router = useRouter()
  const [form,    setForm]    = useState({ full_name: '', email: '', password: '', preferred_language: 'en' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await api.post('/auth/signup', form)
      toast.success('Account created! Please sign in.')
      router.replace('/login')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Something went wrong'
      setError(typeof msg === 'string' ? msg : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const iStyle = (id: string) => ({
    borderColor: focused === id ? 'var(--accent)' : 'var(--border)',
    boxShadow: focused === id ? '0 0 0 3px var(--accent-dim)' : 'none',
  })

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        <h1
          className="text-[26px] font-black tracking-tight"
          style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}
        >
          Create account
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--text-3)' }}>
          Start transcribing meetings in minutes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Full name</label>
          <input
            type="text" required value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            placeholder="Your Full Name"
            className="input-dark block w-full px-3.5 py-3 text-[14px]"
            style={iStyle('name')}
            onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Email</label>
          <input
            type="email" required value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@example.com"
            className="input-dark block w-full px-3.5 py-3 text-[14px]"
            style={iStyle('email')}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} required value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Min. 8 characters"
              className="input-dark block w-full px-3.5 py-3 pr-11 text-[14px]"
              style={iStyle('pw')}
              onFocus={() => setFocused('pw')} onBlur={() => setFocused(null)}
            />
            <button
              type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-hi)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
            >
              {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>
            Meeting language
          </label>
          <div className="flex gap-2">
            {[{ value: 'en', label: 'English' }, { value: 'mn', label: 'Mongolian' }].map((opt) => (
              <button
                key={opt.value} type="button"
                onClick={() => set('preferred_language', opt.value)}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all"
                style={form.preferred_language === opt.value
                  ? { background: 'var(--accent-dim)', color: 'var(--accent-hi)', border: '1px solid rgba(99,102,241,0.35)' }
                  : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl px-3.5 py-3 text-[13px]"
            style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)' }}
          >
            {error}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="btn-accent mt-2 w-full rounded-xl py-3 text-[14px] font-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3-3-3h4z" />
              </svg>
              Creating account…
            </span>
          ) : 'Create account →'}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px]" style={{ color: 'var(--text-3)' }}>
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-bold transition-colors"
          style={{ color: 'var(--accent-hi)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--accent-hi)')}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
