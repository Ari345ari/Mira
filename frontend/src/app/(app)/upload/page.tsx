'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Upload, File, X, Check, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useWorkspaces } from '@/hooks/use-meetings'
import { useWorkspaceStore } from '@/store/workspace'

type Step = 'drop' | 'details' | 'uploading' | 'done'

const ACCEPT = {
  'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.opus'],
  'video/*': ['.mp4', '.mov', '.webm'],
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STEPS = ['File', 'Details', 'Done']

/* Animated waveform logo mark */
function MiraLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="0"  y="8"  width="2.5" height="4"  rx="1.25" fill="currentColor" opacity="0.45"/>
      <rect x="4"  y="5"  width="2.5" height="10" rx="1.25" fill="currentColor" opacity="0.65"/>
      <rect x="8"  y="1"  width="2.5" height="18" rx="1.25" fill="currentColor"/>
      <rect x="12" y="5"  width="2.5" height="10" rx="1.25" fill="currentColor" opacity="0.65"/>
      <rect x="16" y="8"  width="2.5" height="4"  rx="1.25" fill="currentColor" opacity="0.45"/>
    </svg>
  )
}

export default function UploadPage() {
  const router = useRouter()
  const { data: workspaces = [] } = useWorkspaces()
  const { activeWsId } = useWorkspaceStore()
  const [step, setStep]           = useState<Step>('drop')
  const [file, setFile]           = useState<File | null>(null)
  const [meetingId, setMeetingId] = useState<string | null>(null)
  const [focused, setFocused]     = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    participants: '',
    language: 'en',
  })

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      if (!form.title) {
        const name = accepted[0].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setForm((f) => ({ ...f, title: name }))
      }
      setStep('details')
    }
  }, [form.title])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, accept: ACCEPT, maxFiles: 1, maxSize: 500 * 1024 * 1024,
  } as any)

  function setField(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  const iStyle = (id: string) => ({
    borderColor: focused === id ? 'var(--accent)' : 'var(--border)',
    boxShadow: focused === id ? '0 0 0 3px var(--accent-dim)' : 'none',
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return
    const workspaceId = activeWsId ?? workspaces[0]?.id
    if (!workspaceId) { toast.error('No workspace found. Please sign out and back in.'); return }
    setStep('uploading')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('meeting_date', form.meeting_date)
      fd.append('language', form.language)
      fd.append('workspace_id', workspaceId)
      if (form.participants.trim()) fd.append('participants', form.participants.trim())
      const { data } = await api.post('/meetings/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMeetingId(data.id)
      setStep('done')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Upload failed')
      setStep('details')
    }
  }

  const stepIndex = step === 'drop' ? 0 : step === 'details' ? 1 : 2

  if (step === 'done') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-8">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full mb-6"
          style={{
            background: 'var(--green-bg)',
            border: '2px solid var(--green-border)',
            boxShadow: '0 0 40px rgba(16,185,129,0.15)',
          }}
        >
          <Check style={{ width: 36, height: 36, color: 'var(--green)' }} />
        </div>
        <h2 className="text-[24px] font-black mb-2" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
          Uploaded!
        </h2>
        <p className="text-[14px] mb-8 text-center max-w-sm" style={{ color: 'var(--text-2)' }}>
          Mira is transcribing and analyzing your recording. Usually takes under a minute.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setStep('drop'); setFile(null)
              setForm({ title: '', meeting_date: new Date().toISOString().split('T')[0], participants: '', language: 'en' })
            }}
            className="rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text-2)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            Upload another
          </button>
          {meetingId && (
            <button
              onClick={() => router.push(`/meetings/${meetingId}`)}
              className="btn-accent rounded-xl px-5 py-2.5 text-[13px] font-bold"
            >
              View progress →
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full px-8 py-8">
      <div className="mx-auto max-w-2xl">

        <div className="mb-8 animate-fade-up">
          <h1
            className="text-[22px] font-black tracking-tight"
            style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}
          >
            New recording
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-3)' }}>
            Upload an audio or video file — Mira transcribes and analyzes it for you
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-black transition-all"
                  style={i < stepIndex
                    ? { background: 'var(--green-bg)', color: 'var(--green)', border: '1.5px solid var(--green-border)' }
                    : i === stepIndex
                    ? { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }
                    : { background: 'var(--card)', color: 'var(--text-3)', border: '1.5px solid var(--border)' }
                  }
                >
                  {i < stepIndex ? <Check style={{ width: 13, height: 13 }} /> : i + 1}
                </div>
                <span
                  className="text-[13px] font-bold"
                  style={{ color: i <= stepIndex ? 'var(--text-1)' : 'var(--text-3)' }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="h-px w-8"
                  style={{ background: i < stepIndex ? 'var(--green-border)' : 'var(--border)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Dropzone */}
        {step === 'drop' && (
          <div
            {...getRootProps()}
            className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl p-16 text-center transition-all duration-200"
            style={isDragReject
              ? { border: '2px dashed var(--red-border)', background: 'var(--red-bg)' }
              : isDragActive
              ? { border: '2px dashed var(--accent)', background: 'var(--accent-dim)', transform: 'scale(1.01)', boxShadow: '0 0 40px rgba(99,102,241,0.15)' }
              : { border: '2px dashed var(--border)', background: 'var(--card)' }
            }
            onMouseEnter={(e) => {
              if (!isDragActive) {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragActive) {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLElement).style.background = 'var(--card)'
              }
            }}
          >
            <input {...(getInputProps() as any)} />
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all"
              style={isDragActive
                ? { background: 'var(--accent)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', color: '#fff' }
                : { background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent-hi)' }
              }
            >
              <Upload style={{ width: 28, height: 28 }} />
            </div>
            <p className="mb-1.5 text-[17px] font-black" style={{ color: 'var(--text-1)' }}>
              {isDragActive ? 'Drop it!' : 'Drop your recording here'}
            </p>
            <p className="mb-6 text-[13px]" style={{ color: 'var(--text-3)' }}>or click to browse files</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['MP3', 'WAV', 'M4A', 'MP4', 'WEBM', 'FLAC'].map((ext) => (
                <span
                  key={ext}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent-hi)', border: '1px solid rgba(99,102,241,0.15)' }}
                >
                  {ext}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[12px]" style={{ color: 'var(--text-3)' }}>Max 500 MB</p>
          </div>
        )}

        {/* Details form */}
        {step === 'details' && file && (
          <div
            className="overflow-hidden rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {/* File header */}
            <div
              className="flex items-center gap-3 px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                <File style={{ width: 16, height: 16, color: 'var(--accent-hi)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold" style={{ color: 'var(--text-1)' }}>{file.name}</p>
                <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={() => { setFile(null); setStep('drop') }}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent-hi)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-3)' }}
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Title</label>
                <input
                  type="text" required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. Q3 Strategy Review"
                  className="input-dark block w-full px-3.5 py-2.5 text-[13px]"
                  style={iStyle('title')}
                  onFocus={() => setFocused('title')}
                  onBlur={() => setFocused(null)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Date</label>
                  <input
                    type="date" required
                    value={form.meeting_date}
                    onChange={(e) => setField('meeting_date', e.target.value)}
                    className="input-dark block w-full px-3.5 py-2.5 text-[13px]"
                    style={iStyle('date')}
                    onFocus={() => setFocused('date')}
                    onBlur={() => setFocused(null)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Language</label>
                  <select
                    value={form.language}
                    onChange={(e) => setField('language', e.target.value)}
                    className="input-dark block w-full px-3.5 py-2.5 text-[13px]"
                    style={iStyle('lang')}
                    onFocus={() => setFocused('lang')}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="en">English</option>
                    <option value="mn">Mongolian</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>
                  Participants <span className="font-normal" style={{ color: 'var(--text-3)' }}>(comma-separated, optional)</span>
                </label>
                <input
                  type="text"
                  value={form.participants}
                  onChange={(e) => setField('participants', e.target.value)}
                  placeholder="e.g. Sarah, James, Priya"
                  className="input-dark block w-full px-3.5 py-2.5 text-[13px]"
                  style={iStyle('pax')}
                  onFocus={() => setFocused('pax')}
                  onBlur={() => setFocused(null)}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setFile(null); setStep('drop') }}
                  className="rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn-accent flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-black"
                >
                  <MiraLogo />
                  Analyze with Mira
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Uploading */}
        {step === 'uploading' && (
          <div
            className="rounded-2xl p-14 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Loader2 style={{ width: 28, height: 28, color: 'var(--accent)' }} className="animate-spin" />
            </div>
            <h2 className="mb-1 text-[18px] font-black" style={{ color: 'var(--text-1)' }}>Uploading…</h2>
            <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>Mira is receiving your file. Hold tight.</p>
          </div>
        )}

      </div>
    </div>
  )
}
