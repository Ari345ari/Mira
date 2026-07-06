'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { User, Bell, Shield, Trash2, AlertTriangle } from 'lucide-react'

const SECTIONS = [
  { id: 'profile',       label: 'Profile',        icon: User        },
  { id: 'notifications', label: 'Notifications',  icon: Bell        },
  { id: 'security',      label: 'Security',       icon: Shield      },
  { id: 'danger',        label: 'Account & data', icon: Trash2      },
]

const INITIAL_NOTIFS = [
  { id: 'transcribed', label: 'Meeting transcribed',  desc: 'When a meeting finishes transcription',   on: true  },
  { id: 'protocol',    label: 'Protocol generated',   desc: 'When an AI protocol is ready to review',  on: true  },
  { id: 'failed',      label: 'Processing failed',    desc: 'When transcription or analysis fails',    on: true  },
  { id: 'member',      label: 'New workspace member', desc: 'When someone joins your workspace',       on: false },
  { id: 'digest',      label: 'Weekly digest',        desc: 'Weekly summary of your meetings',         on: false },
]

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} role="switch" aria-checked={on}
      className="relative h-5 w-9 rounded-full transition-all duration-200 focus:outline-none"
      style={on
        ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 2px 10px rgba(99,102,241,0.3)' }
        : { background: 'rgba(255,255,255,0.1)' }}>
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? '18px' : '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  )
}

export default function SettingsPage() {
  const { user, setAuth, accessToken, clearAuth } = useAuthStore()
  const router = useRouter()
  const [active,        setActive]        = useState('profile')
  const [name,          setName]          = useState(user?.full_name ?? '')
  const [lang,          setLang]          = useState(user?.preferred_language ?? 'en')
  const [saving,        setSaving]        = useState(false)
  const [focused,       setFocused]       = useState<string | null>(null)
  const [notifs,        setNotifs]        = useState(INITIAL_NOTIFS)
  const [pwForm,        setPwForm]        = useState({ current: '', next: '', confirm: '' })
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteStep,    setDeleteStep]    = useState<'idle' | 'confirm'>('idle')

  function toggleNotif(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, on: !n.on } : n))
    toast.success('Preference saved')
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    if (user && accessToken) setAuth({ ...user, full_name: name, preferred_language: lang }, accessToken)
    setSaving(false)
    toast.success('Settings saved')
  }

  function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    clearAuth()
    toast.success('Account deleted')
    router.push('/')
  }

  function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pwForm.next.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (pwForm.next !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    toast.success('Password updated')
    setPwForm({ current: '', next: '', confirm: '' })
  }

  const iStyle = (id: string) => ({
    borderColor: focused === id ? 'var(--accent)' : 'var(--border)',
    boxShadow: focused === id ? '0 0 0 3px var(--accent-dim)' : 'none',
  })

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  return (
    <div className="min-h-full" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 32px' }}>
      <div style={{ width: '100%', maxWidth: 860 }}>
        <div className="mb-8 animate-fade-up">
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Settings</h1>
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-3)' }}>Manage your account and preferences</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar nav */}
          <nav className="w-44 shrink-0 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActive(id)} className={`nav-item w-full text-left${active === id ? ' active' : ''}`}>
                <Icon style={{ width: 15, height: 15, flexShrink: 0, color: active === id ? 'var(--accent-hi)' : 'var(--text-3)' }} />
                {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Profile */}
            {active === 'profile' && (
              <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <h2 className="text-[14px] font-black" style={{ color: 'var(--text-1)' }}>Profile</h2>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-3)' }}>Update your personal information</p>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-white"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 4px 16px rgba(99,102,241,0.28)' }}>
                      {initials}
                    </div>
                    <div>
                      <button type="button" className="text-[13px] font-semibold transition-colors" style={{ color: 'var(--accent-hi)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent-hi)')}>
                        Change photo
                      </button>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>JPG, PNG or GIF, max 2 MB</p>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Full name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      className="input-dark block w-full px-3.5 py-2.5 text-[13px]" style={iStyle('name')}
                      onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Email</label>
                    <input type="email" value={user?.email ?? ''} disabled
                      className="input-dark block w-full px-3.5 py-2.5 text-[13px] cursor-not-allowed opacity-50" />
                    <p className="mt-1 text-[12px]" style={{ color: 'var(--text-3)' }}>Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Preferred language</label>
                    <div className="flex gap-2">
                      {[{ value: 'en', label: 'English' }, { value: 'mn', label: 'Mongolian' }].map(opt => (
                        <button key={opt.value} type="button" onClick={() => setLang(opt.value)} className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all"
                          style={lang === opt.value
                            ? { background: 'var(--accent-dim)', color: 'var(--accent-hi)', border: '1px solid rgba(99,102,241,0.35)' }
                            : { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={saving} className="btn-accent rounded-xl px-6 py-2.5 text-[13px] font-bold disabled:opacity-50">
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications */}
            {active === 'notifications' && (
              <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <h2 className="text-[14px] font-black" style={{ color: 'var(--text-1)' }}>Notifications</h2>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-3)' }}>Choose what you get notified about</p>
                </div>
                <div className="px-6">
                  {notifs.map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between py-4"
                      style={{ borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{item.label}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>{item.desc}</p>
                      </div>
                      <Toggle on={item.on} onToggle={() => toggleNotif(item.id)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security */}
            {active === 'security' && (
              <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <h2 className="text-[14px] font-black" style={{ color: 'var(--text-1)' }}>Change password</h2>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-3)' }}>Use a strong password with at least 8 characters</p>
                </div>
                <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                  {[
                    { id: 'current', label: 'Current password',     key: 'current' as const },
                    { id: 'next',    label: 'New password',         key: 'next'    as const },
                    { id: 'confirm', label: 'Confirm new password', key: 'confirm' as const },
                  ].map(({ id, label, key }) => (
                    <div key={id}>
                      <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>{label}</label>
                      <input type="password" placeholder="••••••••" value={pwForm[key]}
                        onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                        className="input-dark block w-full px-3.5 py-2.5 text-[13px]" style={iStyle(id)}
                        onFocus={() => setFocused(id)} onBlur={() => setFocused(null)} />
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button type="submit" className="btn-accent rounded-xl px-6 py-2.5 text-[13px] font-bold">
                      Update password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Danger */}
            {active === 'danger' && (
              <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--red-border)' }}>
                <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--red-border)', background: 'var(--red-bg)' }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: 'var(--red)', flexShrink: 0 }} />
                  <div>
                    <h2 className="text-[14px] font-black" style={{ color: 'var(--red)' }}>Account &amp; data</h2>
                    <p className="text-[12px] mt-0.5" style={{ color: 'rgba(239,68,68,0.65)' }}>These actions are permanent and cannot be undone</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>Delete all recordings</p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>Permanently remove all meetings, transcripts, and protocols</p>
                    </div>
                    <button onClick={() => toast.error('Disabled in demo mode')}
                      className="shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all"
                      style={{ color: 'var(--red)', border: '1px solid var(--red-border)', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      Delete all
                    </button>
                  </div>
                  <div style={{ height: 1, background: 'var(--red-border)' }} />
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>Delete account</p>
                        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-3)' }}>Permanently delete your account and all associated data</p>
                      </div>
                      {deleteStep === 'idle' && (
                        <button onClick={() => setDeleteStep('confirm')}
                          className="shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold text-white"
                          style={{ background: 'var(--red)' }}>
                          Delete account
                        </button>
                      )}
                    </div>
                    {deleteStep === 'confirm' && (
                      <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)' }}>
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--red)' }}>
                          Type <span style={{ fontFamily: 'monospace', background: 'rgba(239,68,68,0.15)', padding: '1px 6px', borderRadius: 4 }}>DELETE</span> to confirm
                        </p>
                        <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                          placeholder="DELETE" className="input-dark block w-full px-3.5 py-2.5 text-[13px]"
                          style={{ borderColor: deleteConfirm === 'DELETE' ? 'var(--red)' : 'var(--red-border)', fontFamily: 'monospace' }} />
                        <div className="flex items-center gap-3">
                          <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE'}
                            className="rounded-xl px-5 py-2 text-[13px] font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: 'var(--red)' }}>
                            Permanently delete my account
                          </button>
                          <button onClick={() => { setDeleteStep('idle'); setDeleteConfirm('') }}
                            className="text-[13px]" style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
