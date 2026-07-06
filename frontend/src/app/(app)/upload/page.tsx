'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Upload, File, X, Check, Loader2, Mic, Square, MicOff, Video, ExternalLink, Link2 } from 'lucide-react'
import api from '@/lib/api'
import { useWorkspaces } from '@/hooks/use-meetings'
import { useWorkspaceStore } from '@/store/workspace'

type Step = 'drop' | 'details' | 'uploading' | 'done'
type Mode = 'upload' | 'record' | 'capture'
type RecordState = 'idle' | 'requesting' | 'recording' | 'stopped'

const ACCEPT = {
  'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.opus'],
  'video/*': ['.mp4', '.mov', '.webm'],
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function detectPlatform(url: string): 'zoom' | 'teams' | 'meet' | 'other' {
  if (url.includes('zoom.us'))                                         return 'zoom'
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'teams'
  if (url.includes('meet.google.com'))                                 return 'meet'
  return 'other'
}

const PLATFORM_LABELS: Record<string, string> = {
  zoom: 'Zoom', teams: 'Microsoft Teams', meet: 'Google Meet', other: 'Online meeting',
}
const PLATFORM_COLORS: Record<string, string> = {
  zoom: '#2D8CFF', teams: '#6264A7', meet: '#00AC47', other: '#6366f1',
}

const STEPS = ['File', 'Details', 'Done']

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

function WaveformBars({ active, color = '#ef4444' }: { active: boolean; color?: string }) {
  const heights = [5, 12, 8, 18, 10, 16, 7, 14, 9, 5]
  return (
    <>
      <style>{`@keyframes waveBar { from { transform: scaleY(0.4); } to { transform: scaleY(1.0); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 28 }}>
        {heights.map((h, i) => (
          <div key={i} style={{
            width: 3, height: `${h}px`, borderRadius: 2,
            background: active ? color : 'rgba(255,255,255,0.12)',
            transformOrigin: 'center',
            animation: active ? `waveBar ${0.5 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.06}s`,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
    </>
  )
}

// ── Step indicator 
function StepBar({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-black transition-all"
              style={i < stepIndex
                ? { background: 'var(--green-bg)', color: 'var(--green)', border: '1.5px solid var(--green-border)' }
                : i === stepIndex
                ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }
                : { background: 'var(--card)', color: 'var(--text-3)', border: '1.5px solid var(--border)' }
              }>
              {i < stepIndex ? <Check style={{ width: 13, height: 13 }} /> : i + 1}
            </div>
            <span className="text-[13px] font-bold" style={{ color: i <= stepIndex ? 'var(--text-1)' : 'var(--text-3)' }}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className="h-px w-8" style={{ background: i < stepIndex ? 'var(--green-border)' : 'var(--border)' }} />}
        </div>
      ))}
    </div>
  )
}

export default function UploadPage() {
  const router = useRouter()
  const [progress, setProgress]   = useState(0)
  const { data: workspaces = [] } = useWorkspaces()
  const { activeWsId }            = useWorkspaceStore()
  const [step, setStep]           = useState<Step>('drop')
  const [mode, setMode]           = useState<Mode>('upload')
  const [file, setFile]           = useState<File | null>(null)
  const [meetingId, setMeetingId] = useState<string | null>(null)
  const [focused, setFocused]     = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    participants: '',
    language: 'en',
  })

  // ── Recording / capture state 
  const [recordState, setRecordState]       = useState<RecordState>('idle')
  const [elapsed, setElapsed]               = useState(0)
  const [liveTranscript, setLiveTx]         = useState('')
  const [interimTx, setInterimTx]           = useState('')
  const [recordedDuration, setRecordedDuration] = useState(0)
  const [meetingLink, setMeetingLink]       = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef   = useRef<any>(null)
  const streamRef        = useRef<MediaStream | null>(null)

  useEffect(() => () => {
    timerRef.current && clearInterval(timerRef.current)
    recognitionRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  // ── Shared recording logic 
  function beginRecording(stream: MediaStream) {
    streamRef.current = stream
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
    const mr = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = mr
    chunksRef.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.start(250)

    setElapsed(0); setLiveTx(''); setInterimTx('')
    setRecordState('recording')
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)

    const SpeechRec = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (SpeechRec) {
      const rec = new SpeechRec()
      rec.continuous = true; rec.interimResults = true
      rec.lang = form.language === 'mn' ? 'mn-MN' : 'en-US'
      rec.onresult = (e: any) => {
        let final = '', interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
          else interim += e.results[i][0].transcript
        }
        if (final) setLiveTx(t => t + final)
        setInterimTx(interim)
      }
      rec.onerror = () => {}
      rec.start()
      recognitionRef.current = rec
    }

    // auto-stop when stream ends 
    stream.getTracks().forEach(track => {
      track.onended = () => stopRecording()
    })
  }

  async function startMicRecording() {
    setRecordState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      beginRecording(stream)
    } catch {
      toast.error('Microphone access denied')
      setRecordState('idle')
    }
  }

  async function startCapture() {
    setRecordState('requesting')
    try {
      // Request display media — user will be asked to pick a tab/window
      const displayStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { width: 1, height: 1, frameRate: 1 },
        audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 44100 },
      })

      // Drop video track — we only need audio
      displayStream.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop())

      if (!displayStream.getAudioTracks().length) {
        displayStream.getTracks().forEach((t: MediaStreamTrack) => t.stop())
        toast.error('No audio captured. Make sure to check "Share tab audio" when selecting the tab.')
        setRecordState('idle')
        return
      }

      // Auto-set title from platform if blank
      if (!form.title && meetingLink) {
        const platform = detectPlatform(meetingLink)
        const now = new Date()
        setForm(f => ({ ...f, title: `${PLATFORM_LABELS[platform]} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` }))
      }

      beginRecording(displayStream)
    } catch {
      toast.error('Screen sharing cancelled')
      setRecordState('idle')
    }
  }

  function stopRecording() {
    timerRef.current && clearInterval(timerRef.current)
    recognitionRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setInterimTx('')
    setRecordedDuration(elapsed)

    const mr = mediaRecorderRef.current
    if (!mr || mr.state === 'inactive') return

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType })
      const name = mode === 'capture' ? 'online-meeting-capture.webm' : 'in-person-recording.webm'
      const recordedFile = new globalThis.File([blob], name, { type: mr.mimeType })
      setFile(recordedFile)
      if (!form.title) {
        const now = new Date()
        setForm(f => ({ ...f, title: `Meeting — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` }))
      }
    }
    mr.stop()
    setRecordState('stopped')
  }

  function resetRecording() {
    setRecordState('idle'); setElapsed(0); setLiveTx(''); setInterimTx(''); setFile(null)
  }

  // ── Upload 
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      if (!form.title) setForm(f => ({ ...f, title: accepted[0].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') }))
      setStep('details')
    }
  }, [form.title])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, accept: ACCEPT, maxFiles: 1, maxSize: 500 * 1024 * 1024,
  } as any)

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }
  const iStyle = (id: string) => ({
    borderColor: focused === id ? 'var(--accent)' : 'var(--border)',
    boxShadow: focused === id ? '0 0 0 3px var(--accent-dim)' : 'none',
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return
    const workspaceId = activeWsId ?? workspaces[0]?.id
    if (!workspaceId) { toast.error('No workspace found.'); return }
    setStep('uploading')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('meeting_date', form.meeting_date)
      fd.append('language', form.language)
      fd.append('workspace_id', workspaceId)
      if (form.participants.trim()) fd.append('participants', form.participants.trim())
      const { data } = await api.post('/meetings/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total ?? 1))),
      })
      setMeetingId(data.id)
      setStep('done')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Upload failed')
      setStep('details')
    }
  }

  function resetAll() {
    setStep('drop'); setFile(null); setMode('upload')
    setRecordState('idle'); setElapsed(0); setLiveTx(''); setInterimTx(''); setMeetingLink('')
    setForm({ title: '', meeting_date: new Date().toISOString().split('T')[0], participants: '', language: 'en' })
  }

  const stepIndex = step === 'drop' ? 0 : step === 'details' ? 1 : 2
  const platform  = detectPlatform(meetingLink)
  const platformColor = PLATFORM_COLORS[platform]

  // ── Recording UI shared between record + capture modes 
  function RecordingUI({ captureMode }: { captureMode: boolean }) {
    const accentColor = captureMode ? platformColor : '#ef4444'
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* Idle */}
        {recordState === 'idle' && !captureMode && (
          <div className="flex flex-col items-center justify-center p-16 text-center gap-6">
            <div style={{ width: 88, height: 88, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '2px dashed rgba(239,68,68,0.25)' }}>
              <Mic style={{ width: 34, height: 34, color: '#f87171' }} />
            </div>
            <div>
              <p className="text-[17px] font-black mb-1" style={{ color: 'var(--text-1)' }}>Record in-person meeting</p>
              <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>No bot required — records locally from your microphone, then Mira processes it into a full protocol.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Works offline', 'No Zoom bot needed', 'Private & local'].map(f => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 12, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <Check style={{ width: 10, height: 10, color: '#34d399' }} />{f}
                </span>
              ))}
            </div>
            <button onClick={startMicRecording} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(239,68,68,0.35)' }}>
              <Mic style={{ width: 16, height: 16 }} />Start recording
            </button>
          </div>
        )}

        {/* Requesting */}
        {recordState === 'requesting' && (
          <div className="flex flex-col items-center justify-center p-16 text-center gap-4">
            <Loader2 style={{ width: 32, height: 32, color: accentColor }} className="animate-spin" />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--text-2)' }}>
              {captureMode ? 'Select a tab to share — make sure to check "Share tab audio"' : 'Requesting microphone access…'}
            </p>
          </div>
        )}

        {/* Recording */}
        {recordState === 'recording' && (
          <div className="flex flex-col gap-0">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: captureMode ? `${platformColor}08` : 'rgba(239,68,68,0.04)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}99`, animation: 'pulse 1s ease-in-out infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>
                {captureMode ? `Capturing ${PLATFORM_LABELS[platform]}` : 'Recording'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text-1)', letterSpacing: '0.02em' }}>
                {formatDuration(elapsed)}
              </span>
            </div>

            {captureMode && (
              <div style={{ margin: '16px 20px 0', padding: '10px 14px', borderRadius: 10, background: `${platformColor}10`, border: `1px solid ${platformColor}30`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Video style={{ width: 13, height: 13, color: platformColor, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
                  Capturing audio from your shared tab. Keep the meeting tab open and audible.
                </p>
              </div>
            )}

            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
              <WaveformBars active={true} color={accentColor} />
            </div>

            <div style={{ margin: '0 20px 20px', borderRadius: 10, padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', minHeight: 100, maxHeight: 200, overflowY: 'auto' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Live transcript
                {!(window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition && (
                  <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Chrome/Edge only)</span>
                )}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)', whiteSpace: 'pre-wrap', margin: 0 }}>
                {liveTranscript}
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{interimTx}</span>
                {!liveTranscript && !interimTx && <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Listening…</span>}
              </p>
            </div>

            <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'center' }}>
              <button onClick={stopRecording} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, fontSize: 13, fontWeight: 800, background: `${accentColor}18`, border: `1.5px solid ${accentColor}55`, color: accentColor, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${accentColor}28` }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${accentColor}18` }}>
                <Square style={{ width: 13, height: 13 }} />
                Stop {captureMode ? 'capturing' : 'recording'}
              </button>
            </div>
          </div>
        )}

        {/* Stopped */}
        {recordState === 'stopped' && (
          <div className="flex flex-col gap-0">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-bg)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MicOff style={{ width: 16, height: 16, color: 'var(--green)' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                  {captureMode ? 'Capture complete' : 'Recording complete'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Duration: {formatDuration(recordedDuration)}</p>
              </div>
            </div>

            {liveTranscript && (
              <div style={{ margin: '16px 20px 0', borderRadius: 10, padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', maxHeight: 160, overflowY: 'auto' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Live transcript preview</p>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)', whiteSpace: 'pre-wrap', margin: 0 }}>{liveTranscript}</p>
              </div>
            )}

            <div style={{ padding: '16px 20px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={resetRecording} style={{ padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
                {captureMode ? 'Capture again' : 'Record again'}
              </button>
              <button onClick={() => setStep('details')} className="btn-accent"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 800 }}>
                <Check style={{ width: 13, height: 13 }} />
                Use this {captureMode ? 'capture' : 'recording'} →
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Done screen 
  if (step === 'done') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full mb-6"
          style={{ background: 'var(--green-bg)', border: '2px solid var(--green-border)', boxShadow: '0 0 40px rgba(16,185,129,0.15)' }}>
          <Check style={{ width: 36, height: 36, color: 'var(--green)' }} />
        </div>
        <h2 className="text-[24px] font-black mb-2" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Uploaded!</h2>
        <p className="text-[14px] mb-8 text-center max-w-sm" style={{ color: 'var(--text-2)' }}>
          Mira is transcribing and analyzing your recording. Usually takes under a minute.
        </p>
        <div className="flex gap-3">
          <button onClick={resetAll} className="rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
            Upload another
          </button>
          {meetingId && (
            <button onClick={() => router.push(`/meetings/${meetingId}`)} className="btn-accent rounded-xl px-5 py-2.5 text-[13px] font-bold">
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
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            New recording
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-3)' }}>
            Upload a file, record in-person, or capture an online meeting — Mira turns it into a full protocol
          </p>
        </div>

        <StepBar stepIndex={stepIndex} />

        {/* Mode tabs */}
        {step === 'drop' && (
          <div className="mb-5 flex gap-2 flex-wrap">
            {([
              { id: 'upload',  label: 'Upload file',        icon: Upload },
              { id: 'record',  label: 'Record in-person',   icon: Mic },
              { id: 'capture', label: 'Capture online meeting', icon: Video },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setMode(id); resetRecording() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: mode === id ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--card)',
                  border: mode === id ? 'none' : '1px solid var(--border)',
                  color: mode === id ? '#fff' : 'var(--text-2)',
                  cursor: 'pointer',
                  boxShadow: mode === id ? '0 4px 14px rgba(99,102,241,0.3)' : 'none',
                  transition: 'all 0.15s',
                }}>
                <Icon style={{ width: 13, height: 13 }} />{label}
              </button>
            ))}
          </div>
        )}

        {/* ── UPLOAD MODE ── */}
        {step === 'drop' && mode === 'upload' && (
          <div {...getRootProps()} className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl p-16 text-center transition-all duration-200"
            style={isDragReject
              ? { border: '2px dashed var(--red-border)', background: 'var(--red-bg)' }
              : isDragActive
              ? { border: '2px dashed var(--accent)', background: 'var(--accent-dim)', transform: 'scale(1.01)', boxShadow: '0 0 40px rgba(99,102,241,0.15)' }
              : { border: '2px dashed var(--border)', background: 'var(--card)' }
            }
            onMouseEnter={(e) => { if (!isDragActive) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'; (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)' } }}
            onMouseLeave={(e) => { if (!isDragActive) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--card)' } }}>
            <input {...(getInputProps() as any)} />
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all"
              style={isDragActive
                ? { background: 'var(--accent)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', color: '#fff' }
                : { background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent-hi)' }}>
              <Upload style={{ width: 28, height: 28 }} />
            </div>
            <p className="mb-1.5 text-[17px] font-black" style={{ color: 'var(--text-1)' }}>{isDragActive ? 'Drop it!' : 'Drop your recording here'}</p>
            <p className="mb-6 text-[13px]" style={{ color: 'var(--text-3)' }}>or click to browse files</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['MP3', 'WAV', 'M4A', 'MP4', 'WEBM', 'FLAC'].map(ext => (
                <span key={ext} className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent-hi)', border: '1px solid rgba(99,102,241,0.15)' }}>{ext}</span>
              ))}
            </div>
            <p className="mt-4 text-[12px]" style={{ color: 'var(--text-3)' }}>Max 500 MB</p>
          </div>
        )}

        {/* ── RECORD MODE ── */}
        {step === 'drop' && mode === 'record' && <RecordingUI captureMode={false} />}

        {/* ── CAPTURE MODE ── */}
        {step === 'drop' && mode === 'capture' && (
          <div className="flex flex-col gap-4">

            {/* Meeting link input — only show when idle */}
            {recordState === 'idle' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div style={{ padding: '20px 20px 16px' }}>
                  <p className="text-[13px] font-bold mb-3" style={{ color: 'var(--text-2)' }}>Meeting link (optional)</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Link2 style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: meetingLink ? platformColor : 'var(--text-3)' }} />
                      <input
                        type="url"
                        value={meetingLink}
                        onChange={e => setMeetingLink(e.target.value)}
                        placeholder="https://zoom.us/j/… or meet.google.com/…"
                        style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 9, fontSize: 13, background: 'rgba(255,255,255,0.05)', border: `1px solid ${meetingLink ? platformColor + '55' : 'var(--border)'}`, color: 'var(--text-1)', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                      />
                    </div>
                    {meetingLink && (
                      <button onClick={() => window.open(meetingLink, '_blank')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: `${platformColor}18`, border: `1px solid ${platformColor}40`, color: platformColor, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <ExternalLink style={{ width: 12, height: 12 }} />
                        Open {PLATFORM_LABELS[platform]}
                      </button>
                    )}
                  </div>
                  {meetingLink && (
                    <p style={{ fontSize: 11, color: platformColor, marginTop: 6, fontWeight: 600 }}>
                      ✓ {PLATFORM_LABELS[platform]} detected
                    </p>
                  )}
                </div>

                {/* Step-by-step instructions */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>How it works</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { n: '1', text: 'Join your Zoom, Teams, or Meet meeting in another tab' },
                      { n: '2', text: 'Click "Start capturing" below' },
                      { n: '3', text: 'When prompted, select the meeting tab — check "Share tab audio"' },
                      { n: '4', text: 'Mira captures and transcribes in real-time. Stop when done.' },
                    ].map(({ n, text }) => (
                      <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#818cf8' }}>{n}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', justifyContent: 'center' }}>
                  <button onClick={startCapture}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.35)' }}>
                    <Video style={{ width: 16, height: 16 }} />
                    Start capturing
                  </button>
                </div>
              </div>
            )}

            {/* Shared recording UI for requesting/recording/stopped states */}
            {recordState !== 'idle' && <RecordingUI captureMode={true} />}
          </div>
        )}

        {/* ── DETAILS FORM ── */}
        {step === 'details' && file && (
          <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: mode === 'record' ? 'rgba(239,68,68,0.1)' : mode === 'capture' ? `${platformColor}18` : 'var(--accent-dim)', border: `1px solid ${mode === 'record' ? 'rgba(239,68,68,0.2)' : mode === 'capture' ? `${platformColor}35` : 'rgba(99,102,241,0.15)'}` }}>
                {mode === 'record'  ? <Mic   style={{ width: 16, height: 16, color: '#f87171' }} />
                 : mode === 'capture' ? <Video style={{ width: 16, height: 16, color: platformColor }} />
                 : <File style={{ width: 16, height: 16, color: 'var(--accent-hi)' }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold" style={{ color: 'var(--text-1)' }}>
                  {mode === 'record' ? `In-person recording · ${formatDuration(recordedDuration)}`
                   : mode === 'capture' ? `${PLATFORM_LABELS[platform]} capture · ${formatDuration(recordedDuration)}`
                   : file.name}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>{formatBytes(file.size)}</p>
              </div>
              <button onClick={() => { setFile(null); setStep('drop'); if (mode !== 'upload') resetRecording() }}
                className="rounded-lg p-1.5 transition-colors" style={{ color: 'var(--text-3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent-hi)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-3)' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Title</label>
                <input type="text" required value={form.title} onChange={e => setField('title', e.target.value)}
                  placeholder="e.g. Q3 Strategy Review" className="input-dark block w-full px-3.5 py-2.5 text-[13px]"
                  style={iStyle('title')} onFocus={() => setFocused('title')} onBlur={() => setFocused(null)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Date</label>
                  <input type="date" required value={form.meeting_date} onChange={e => setField('meeting_date', e.target.value)}
                    className="input-dark block w-full px-3.5 py-2.5 text-[13px]"
                    style={iStyle('date')} onFocus={() => setFocused('date')} onBlur={() => setFocused(null)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Language</label>
                  <select value={form.language} onChange={e => setField('language', e.target.value)}
                    className="input-dark block w-full px-3.5 py-2.5 text-[13px]"
                    style={iStyle('lang')} onFocus={() => setFocused('lang')} onBlur={() => setFocused(null)}>
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
                <input type="text" value={form.participants} onChange={e => setField('participants', e.target.value)}
                  placeholder="e.g. Sarah, James, Priya" className="input-dark block w-full px-3.5 py-2.5 text-[13px]"
                  style={iStyle('pax')} onFocus={() => setFocused('pax')} onBlur={() => setFocused(null)} />
              </div>
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => { setFile(null); setStep('drop'); if (mode !== 'upload') resetRecording() }}
                  className="rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  ← Back
                </button>
                <button type="submit" className="btn-accent flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-black">
                  <MiraLogo />Analyze with Mira
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── UPLOADING ── */}
        {step === 'uploading' && (
          <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-3)' }}>{progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}</p>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, marginTop: 12 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#6366f1', borderRadius: 4, transition: 'width 0.2s' }} />
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl mt-8"
              style={{ background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)' }}>
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
