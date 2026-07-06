'use client'

import { useState, useEffect, useMemo, useCallback, useRef, use } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft, Clock, Users, Globe, CheckSquare, MessageSquare,
  Loader2, AlertCircle, Music, BarChart2,
  Video, Check, FileText, CalendarPlus, Link2, Calendar, Shield,
  FolderOpen, X,
} from 'lucide-react'
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx'
import { useMeeting, useTranscript, useProtocol, useProjects, useAssignProject, useSuggestProject, useDismissSuggestion, useTemplates } from '@/hooks/use-meetings'
import { useWorkspaceStore } from '@/store/workspace'
import { useMediaPlayer } from '@/hooks/use-media-player'
import { MeetingStatus } from '@/types'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { formatTime } from '@/lib/format'
import { C, LANG, SPEAKER_COLORS, ACTION_STATUSES, type ActionStatus } from '@/components/meetings/constants'
import { MeetingStatusBadge } from '@/components/meetings/status-badge'
import { MediaPlayer } from '@/components/meetings/media-player'
import { SpeakerRenameModal } from '@/components/meetings/speaker-rename-modal'
import { Tip } from '@/components/ui/tip'
import { ProtocolTab } from '@/components/meetings/tabs/protocol-tab'
import { TranscriptTab } from '@/components/meetings/tabs/transcript-tab'
import { AnalyticsTab } from '@/components/meetings/tabs/analytics-tab'
import { DocumentTab } from '@/components/meetings/tabs/document-tab'

type Tab = 'protocol' | 'transcript' | 'analytics' | 'document'

const TABS: { id: Tab; label: string; icon: any; hint: string }[] = [
  { id: 'protocol',   label: 'Protocol',   icon: CheckSquare,  hint: 'Summary, decisions, action items, and open questions from the meeting.' },
  { id: 'transcript', label: 'Transcript', icon: MessageSquare, hint: 'Full word-for-word transcript with speaker labels. Search, filter, or sync with playback.' },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart2,     hint: 'Talk time per speaker, meeting score breakdown, and participation stats.' },
  { id: 'document',   label: 'Document',   icon: FileText,      hint: 'Edit and annotate the protocol with your own notes section by section.' },
]

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [tab, setTab]             = useState<Tab>('protocol')

  const [replayMode, setReplayMode] = useState(false)
  const [notes, setNotes]         = useState<Record<string, string>>({})
  const [docEdits, setDocEdits]   = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(`mira-doc-edits-${id}`) ?? '{}') } catch { return {} }
  })
  const [actionStatuses, setActionStatuses] = useState<Record<number, ActionStatus>>({})
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(`mira-speakers-${id}`) ?? '{}') } catch { return {} }
  })
  const [renamingSpk, setRenamingSpk] = useState<string | null>(null)
  const [meetingLink, setMeetingLink] = useState('')

  const { data: meeting, isLoading: meetingLoading } = useMeeting(id)
  const isDone = meeting?.status === MeetingStatus.DONE
  const { data: protocol }    = useProtocol(id, isDone)
  const { data: transcript }  = useTranscript(id, isDone)

  const media = useMediaPlayer(id, isDone)

  // ── Project assignment ────────────────────────────────────────────
  const { activeWsId } = useWorkspaceStore()
  const wsId = meeting?.workspace_id ?? activeWsId
  const { data: projects = [] } = useProjects(wsId)
  const { data: templates = [] } = useTemplates(wsId)
  const assignProject     = useAssignProject()
  const suggestProject    = useSuggestProject()
  const dismissSuggestion = useDismissSuggestion()
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    if (!showProjectPicker) return
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowProjectPicker(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showProjectPicker])

  const currentProject   = projects.find((p: any) => p.id === meeting?.folder_id) ?? null
  const suggestedProject = !meeting?.suggestion_dismissed && meeting?.suggested_project_id
    ? projects.find((p: any) => p.id === meeting?.suggested_project_id) ?? null
    : null

  // Trigger AI suggestion once when meeting finishes processing
  useEffect(() => {
    if (isDone && meeting && !meeting.suggested_project_id && !meeting.suggestion_dismissed && !meeting.folder_id && projects.length > 0) {
      suggestProject.mutate(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, meeting?.id, projects.length])

  // ── Derived ──────────────────────────────────────────────────────
  const speakerStats = useMemo(() => {
    if (!transcript?.speaker_turns?.length) return []
    const stats: Record<string, { words: number; seconds: number; color: typeof SPEAKER_COLORS[number] }> = {}
    let colorIdx = 0
    for (const turn of transcript.speaker_turns as any[]) {
      if (!stats[turn.speaker]) {
        stats[turn.speaker] = { words: 0, seconds: 0, color: SPEAKER_COLORS[colorIdx++ % SPEAKER_COLORS.length] }
      }
      stats[turn.speaker].words   += turn.text?.split(/\s+/).length ?? 0
      stats[turn.speaker].seconds += Math.max(0, turn.end - turn.start)
    }
    const total = Object.values(stats).reduce((s, v) => s + v.seconds, 0)
    return Object.entries(stats)
      .map(([speaker, { words, seconds, color }]) => ({ speaker, words, seconds, color, pct: total > 0 ? Math.round(seconds / total * 100) : 0 }))
      .sort((a, b) => b.seconds - a.seconds)
  }, [transcript])

  const activeTurnIndex = useMemo(() => {
    if (!transcript?.speaker_turns) return -1
    return (transcript.speaker_turns as any[]).findIndex(
      (t) => media.currentTime >= t.start && media.currentTime <= t.end
    )
  }, [media.currentTime, transcript])

  const speakerName = useCallback((raw: string) => {
    if (speakerNames[raw]) return speakerNames[raw]
    const m = raw.match(/^SPEAKER_?0*(\d+)$/i)
    return m ? `Speaker ${parseInt(m[1], 10) + 1}` : raw
  }, [speakerNames])

  // ── Persistence ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const n = localStorage.getItem(`mira-notes-${id}`)
      if (n) setNotes(JSON.parse(n))
      const a = localStorage.getItem(`mira-actions-${id}`)
      if (a) setActionStatuses(JSON.parse(a))
    } catch {}
  }, [id])

  const updateNote = useCallback((key: string, value: string) => {
    setNotes(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(`mira-notes-${id}`, JSON.stringify(next)) } catch {}
      return next
    })
  }, [id])

  const updateDocEdit = useCallback((key: string, value: string) => {
    setDocEdits(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(`mira-doc-edits-${id}`, JSON.stringify(next)) } catch {}
      return next
    })
  }, [id])

  const cycleActionStatus = useCallback((idx: number) => {
    setActionStatuses(prev => {
      const ci = ACTION_STATUSES.indexOf(prev[idx] ?? 'todo')
      const next = { ...prev, [idx]: ACTION_STATUSES[(ci + 1) % ACTION_STATUSES.length] }
      try { localStorage.setItem(`mira-actions-${id}`, JSON.stringify(next)) } catch {}
      return next
    })
  }, [id])

  const saveSpeakerName = useCallback((speaker: string, name: string) => {
    const updated = name
      ? { ...speakerNames, [speaker]: name }
      : Object.fromEntries(Object.entries(speakerNames).filter(([k]) => k !== speaker))
    setSpeakerNames(updated)
    try { localStorage.setItem(`mira-speakers-${id}`, JSON.stringify(updated)) } catch {}
    setRenamingSpk(null)
  }, [id, speakerNames])

  // ── Side effects ─────────────────────────────────────────────────
  useEffect(() => {
    if (!replayMode || activeTurnIndex < 0 || tab !== 'transcript') return
    document.getElementById(`tx-turn-${activeTurnIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeTurnIndex, replayMode, tab])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return
      if      (e.key === 'p' || e.key === 'P') { e.preventDefault(); setTab('protocol') }
      else if (e.key === 't' || e.key === 'T') { e.preventDefault(); setTab('transcript') }
      else if (e.key === 'a' || e.key === 'A') { e.preventDefault(); setTab('analytics') }
      else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); setTab('document') }
      else if (e.key === ' ' && media.mediaUrl)  { e.preventDefault(); media.togglePlay() }
      else if (e.key === '/' && tab === 'transcript') { e.preventDefault(); document.getElementById('tx-search')?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tab, media])

  // ── Exports ───────────────────────────────────────────────────────
  async function exportDOCX() {
    if (!protocol || !meeting) return

    const ed      = docEdits
    const font    = 'Times New Roman'
    const body    = 24  // 12pt in half-points
    const title   = 32  // 16pt in half-points
    const sp      = { before: 0, after: 0, line: 276, lineRule: 'auto' as const }
    const indent  = { firstLine: 709 }  // 1.25 cm
    const noB     = { top: { style: 'none' as const, size: 0, color: 'FFFFFF' }, bottom: { style: 'none' as const, size: 0, color: 'FFFFFF' }, left: { style: 'none' as const, size: 0, color: 'FFFFFF' }, right: { style: 'none' as const, size: 0, color: 'FFFFFF' } }

    // helpers
    type TROpts = { bold?: boolean; italics?: boolean; allCaps?: boolean; size?: number }
    const tr  = (text: string, opts?: TROpts) => new TextRun({ text, font, size: body, ...opts })
    const gap = (pt = 10) => new Paragraph({ children: [new TextRun('')], spacing: { before: 0, after: 0, line: pt * 20, lineRule: 'exact' as const } })

    const titlePara = (text: string) => new Paragraph({
      children: [new TextRun({ text, font, size: title, bold: true, allCaps: true })],
      alignment: AlignmentType.CENTER, spacing: sp,
    })
    const bodyPara = (runs: TextRun[], justify = true, firstIndent = true) => new Paragraph({
      children: runs, spacing: sp,
      alignment: justify ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
      indent: firstIndent ? indent : undefined,
    })
    const boldPara = (text: string, center = false, allCaps = false) => new Paragraph({
      children: [new TextRun({ text, font, size: body, bold: true, allCaps })],
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: sp,
    })
    const numberedPara = (n: number, text: string) => new Paragraph({
      children: [new TextRun({ text: `${n}.`, font, size: body, bold: true }), new TextRun({ text: `\t${text}`, font, size: body })],
      spacing: sp,
      indent: { left: 360, hanging: 360 },
    })

    // info-line table: date left | No. center | location right
    const langLabel = meeting.language ? (LANG[meeting.language] ?? meeting.language) : ''
    const infoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noB,
      rows: [new TableRow({
        children: [
          new TableCell({ borders: noB, children: [new Paragraph({ children: [tr(format(new Date(meeting.meeting_date), 'MMMM d, yyyy'))], spacing: sp })] }),
          new TableCell({ borders: noB, children: [new Paragraph({ children: [tr(`No.: ${meeting.id?.slice(0, 8).toUpperCase() ?? '01'}`, { bold: true })], alignment: AlignmentType.CENTER, spacing: sp })] }),
          new TableCell({ borders: noB, children: [new Paragraph({ children: [tr(langLabel)], alignment: AlignmentType.RIGHT, spacing: sp })] }),
        ],
      })],
    })

    const children: (Paragraph | Table)[] = []

    // Title block
    if (meeting.workspace_name) children.push(titlePara(meeting.workspace_name))
    children.push(titlePara(meeting.title), titlePara('Meeting Minutes'))
    children.push(gap(12))
    children.push(infoTable)
    children.push(gap(10))

    // Summary
    if (protocol.summary) {
      children.push(bodyPara([tr(ed['summary'] ?? protocol.summary)]))
      children.push(gap(8))
    }

    // Attendees
    const participants: string[] = meeting.participants ?? []
    if (participants.length > 0) {
      children.push(bodyPara([tr('Attendees: ', { bold: true }), tr(participants.join(', ') + '.')]))
      children.push(gap(8))
    }

    // By majority vote
    if (protocol.agenda_items?.length > 0) {
      children.push(boldPara('By majority vote, the meeting commenced.', true))
      children.push(gap(12))
    }

    // Agenda items
    protocol.agenda_items?.forEach((item: any, i: number) => {
      children.push(boldPara(`AGENDA ITEM ${i + 1}: ${item.title}${item.duration_min ? ` (${item.duration_min} min)` : ''}`, false, true))
      children.push(gap(6))
    })

    if (protocol.agenda_items?.length > 0) children.push(gap(6))

    // Decisions
    if (protocol.key_decisions?.length > 0) {
      children.push(boldPara('DECISIONS MADE:', false, true))
      children.push(gap(4))
      protocol.key_decisions.forEach((d: any, i: number) =>
        children.push(numberedPara(i + 1, ed[`decision-${i}`] ?? (d.decision ?? String(d)))))
      children.push(gap(8))
    }

    // Action items (task + deadline only)
    if (protocol.action_items?.length > 0) {
      children.push(boldPara('ASSIGNED TASKS:', false, true))
      children.push(gap(4))
      protocol.action_items.forEach((a: any, i: number) => {
        children.push(numberedPara(i + 1, ed[`action-${i}`] ?? a.task))
        if (a.due_date) children.push(new Paragraph({ children: [new TextRun({ text: `Deadline: ${a.due_date}`, font, size: 22, italics: true })], spacing: sp, indent: { left: 360 } }))
      })
      children.push(gap(8))
    }

    // Unresolved matters
    if (protocol.open_questions?.length > 0) {
      children.push(boldPara('UNRESOLVED MATTERS:', false, true))
      children.push(gap(4))
      protocol.open_questions.forEach((q: any, i: number) =>
        children.push(numberedPara(i + 1, ed[`question-${i}`] ?? (q.question ?? String(q)))))
      children.push(gap(8))
    }

    // Next meeting
    if (protocol.next_meeting?.proposed_date) {
      children.push(bodyPara([tr('Next meeting: ', { bold: true }), tr(protocol.next_meeting.proposed_date + (protocol.next_meeting.topics?.length ? ' — ' + protocol.next_meeting.topics.join(', ') : ''))]))
      children.push(gap(8))
    }

    // Closing
    children.push(gap(12))
    children.push(bodyPara([tr('The meeting concluded.')], false, false))

    // Signature block
    children.push(gap(28))
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noB,
      rows: [new TableRow({
        children: [
          new TableCell({ borders: noB, children: [new Paragraph({ children: [tr('Committee Staff Responsible\nfor the Meeting')], spacing: sp })] }),
          new TableCell({ borders: noB, children: [new Paragraph({ children: [tr(meeting.created_by_name ?? '')], spacing: sp })] }),
        ],
      })],
    }))

    const blob = await Packer.toBlob(new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1417, bottom: 1417, left: 1417, right: 1417 },
          },
        },
        children,
      }],
    }))
    const fileName = `${meeting.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 48)}-protocol.docx`

    // Browser download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = fileName; a.click()
    URL.revokeObjectURL(url)

    // Save to workspace Files
    const form = new FormData()
    form.append('file', blob, fileName)
    try {
      await api.post(`/workspaces/${meeting.workspace_id}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Downloaded and saved to Files')
    } catch {
      toast.success('Downloaded (could not save to Files)')
    }
  }

  function downloadIcal() {
    if (!protocol?.next_meeting?.proposed_date || !meeting) return
    const start = new Date(protocol.next_meeting.proposed_date)
    if (isNaN(start.getTime())) { toast.error('Could not parse next meeting date'); return }
    const end = new Date(start.getTime() + 3600000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
    const topics = protocol.next_meeting.topics?.length ? `\\nTopics: ${protocol.next_meeting.topics.join(', ')}` : ''
    const ical = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mira//Protocol//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:Follow-up: ${meeting.title}`,
      `DESCRIPTION:Scheduled via Mira from "${meeting.title}"${topics}`,
      `UID:mira-${id}-next@mira.ai`, `DTSTAMP:${fmt(new Date())}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([ical], { type: 'text/calendar' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'next-meeting.ics'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Calendar event downloaded')
  }

// ── Render ────────────────────────────────────────────────────────
  if (meetingLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
      </div>
    )
  }
  if (!meeting) {
    return (
      <div style={{ display: 'flex', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <AlertCircle style={{ width: 32, height: 32, color: C.text3 }} />
        <p style={{ fontSize: 14, color: C.text2 }}>Meeting not found</p>
        <Link href="/meetings" style={{ fontSize: 13, fontWeight: 600, color: C.accentHi, textDecoration: 'none' }}>← Back</Link>
      </div>
    )
  }

  const isProcessing = ![MeetingStatus.DONE, MeetingStatus.FAILED].includes(meeting.status)

  return (
    <div style={{ minHeight: '100%' }}>

      {/* Breadcrumb */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 32px', background: '#0d0d14', borderBottom: `1px solid ${C.border}`, backdropFilter: 'blur(12px)' }}>
        <Link href="/meetings" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.text3, textDecoration: 'none', transition: 'color 0.1s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.text2)} onMouseLeave={(e) => (e.currentTarget.style.color = C.text3)}>
          <ArrowLeft style={{ width: 13, height: 13 }} />Recordings
        </Link>
        <span style={{ color: C.border }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meeting.title}</span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero header */}
        <div style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(155deg, #0e0e1d 0%, #11101e 60%, #0d0d18 100%)', border: `1px solid ${C.border}`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -70, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.09)', filter: 'blur(55px)', pointerEvents: 'none' }} />
          <div style={{ height: 3, background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 55%, rgba(99,102,241,0.12) 100%)' }} />

          <div style={{ padding: '22px 28px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, background: media.isVideo ? 'rgba(14,165,233,0.12)' : 'rgba(99,102,241,0.12)', border: `1px solid ${media.isVideo ? 'rgba(14,165,233,0.2)' : 'rgba(99,102,241,0.2)'}` }}>
                {media.isVideo ? <Video style={{ width: 16, height: 16, color: '#38bdf8' }} /> : <Music style={{ width: 16, height: 16, color: C.accentHi }} />}
              </div>
              <MeetingStatusBadge status={meeting.status} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: C.text1, margin: '0 0 10px', lineHeight: 1.25 }}>{meeting.title}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                  {[
                    { icon: Clock, text: format(new Date(meeting.meeting_date), 'MMMM d, yyyy') },
                    meeting.duration_seconds ? { icon: Clock, text: formatTime(meeting.duration_seconds) } : null,
                    meeting.language         ? { icon: Globe, text: LANG[meeting.language] ?? meeting.language } : null,
                    meeting.participants?.length > 0 ? { icon: Users, text: meeting.participants.join(', ') } : null,
                  ].filter(Boolean).map((item: any, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.text2 }}>
                      <item.icon style={{ width: 13, height: 13, color: 'rgba(99,102,241,0.55)' }} />{item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {isDone && protocol && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                {[
                  { label: 'Decisions', value: protocol.key_decisions?.length ?? 0,  color: C.accentHi },
                  { label: 'Actions',   value: protocol.action_items?.length ?? 0,    color: '#34d399' },
                  { label: 'Questions', value: protocol.open_questions?.length ?? 0,  color: '#fbbf24' },
                  { label: 'Speakers',  value: speakerStats.length || (transcript?.speaker_count ?? 0), color: '#60a5fa' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color, margin: 0, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
                    <p style={{ fontSize: 10, color: C.text3, margin: '3px 0 0', fontWeight: 500 }}>{label}</p>
                  </div>
                ))}
              </div>
            )}

            {isDone && protocol?.next_meeting?.proposed_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <Tip text="Downloads an iCal (.ics) event for the next scheduled meeting.">
                  <button onClick={downloadIcal} style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 600, background: C.surface, border: `1px solid ${C.border}`, color: '#34d399', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.background = 'rgba(16,185,129,0.06)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface }}>
                    <CalendarPlus style={{ width: 11, height: 11 }} />iCal
                  </button>
                </Tip>
              </div>
            )}
          </div>
        </div>

        {/* Media player */}
        {isDone && !media.mediaError && (
          <MediaPlayer
            {...media}
            speakerTurns={transcript?.speaker_turns ?? []}
            speakerStats={speakerStats}
          />
        )}

        {/* No recording — connect card */}
        {media.mediaError && (
          <div style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(155deg,#0e0e1d 0%,#11101e 60%,#0d0d18 100%)', border: `1px solid ${C.border}` }}>
            <div style={{ height: 2, background: 'linear-gradient(90deg,#6366f1,#818cf8,rgba(99,102,241,0.12))' }} />
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.text1, margin: '0 0 4px' }}>No recording found</p>
                  <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>Paste a live meeting link or connect your calendar to get notes automatically.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, borderRadius: 99, padding: '4px 10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', flexShrink: 0 }}>
                  <Shield style={{ width: 11, height: 11, color: '#34d399' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.04em' }}>100% PRIVATE</span>
                </div>
              </div>

              {/* Option 1 — Live link */}
              <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(99,102,241,0.05)', border: `1px solid rgba(99,102,241,0.18)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Link2 style={{ width: 14, height: 14, color: C.accentHi }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.accentHi, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Paste meeting link</span>
                </div>
                <p style={{ fontSize: 12, color: C.text3, margin: '0 0 12px' }}>
                  Start a meeting on <b style={{ color: C.text2 }}>Zoom</b>, <b style={{ color: C.text2 }}>Google Meet</b>, or <b style={{ color: C.text2 }}>Teams</b> and paste the link — Mira joins in 1–2 minutes.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && meetingLink.trim()) { toast('Live meeting join coming soon'); setMeetingLink('') } }}
                    placeholder="https://zoom.us/j/… or meet.google.com/…"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text1, outline: 'none', fontFamily: 'inherit' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                  />
                  <button
                    onClick={() => { if (meetingLink.trim()) { toast('Live meeting join coming soon'); setMeetingLink('') } }}
                    style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: meetingLink.trim() ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)', color: meetingLink.trim() ? '#fff' : C.text3, border: 'none', cursor: meetingLink.trim() ? 'pointer' : 'default', transition: 'all 0.15s', boxShadow: meetingLink.trim() ? '0 3px 10px rgba(99,102,241,0.3)' : 'none', flexShrink: 0 }}
                  >
                    Join →
                  </button>
                </div>
                {/* Platform badges */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {[
                    { label: 'Zoom', color: '#2D8CFF' },
                    { label: 'Google Meet', color: '#34A853' },
                    { label: 'Teams', color: '#6264A7' },
                  ].map(({ label, color }) => (
                    <span key={label} style={{ fontSize: 10, fontWeight: 600, borderRadius: 5, padding: '2px 8px', background: `${color}18`, border: `1px solid ${color}40`, color }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 11, color: C.text3, fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              {/* Option 2 — Calendar */}
              <div style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Calendar style={{ width: 14, height: 14, color: C.text2 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Connect your calendar</span>
                </div>
                <p style={{ fontSize: 12, color: C.text3, margin: '0 0 14px' }}>Auto-detect meetings from Google Calendar or Outlook — Mira joins automatically.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toast('Google Calendar integration coming soon')}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text2, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#34A85360'; e.currentTarget.style.background = '#34A85310' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  >
                    <span style={{ fontSize: 14 }}>📅</span>Google Calendar
                  </button>
                  <button
                    onClick={() => toast('Outlook integration coming soon')}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text2, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0078D460'; e.currentTarget.style.background = '#0078D410' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  >
                    <span style={{ fontSize: 14 }}>📧</span>Outlook
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Processing / failed banners */}
        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 12, padding: '14px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <Loader2 style={{ width: 16, height: 16, color: '#fbbf24', flexShrink: 0 }} className="animate-spin" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', margin: 0 }}>Mira is processing this recording</p>
              <p style={{ fontSize: 12, color: 'rgba(245,158,11,0.65)', margin: '3px 0 0' }}>Usually takes under a minute · auto-updates</p>
            </div>
          </div>
        )}
        {meeting.status === MeetingStatus.FAILED && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 12, padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <AlertCircle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#f87171', margin: 0 }}>Processing failed</p>
              <p style={{ fontSize: 12, color: 'rgba(239,68,68,0.65)', margin: '3px 0 0' }}>{meeting.error_message ?? 'An unknown error occurred.'}</p>
            </div>
          </div>
        )}

        {/* AI folder suggestion banner */}
        {isDone && suggestedProject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: '12px 16px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.22)' }}>
            <FolderOpen style={{ width: 15, height: 15, color: '#818cf8', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: C.text2, margin: 0, flex: 1 }}>
              AI thinks this belongs to <b style={{ color: '#818cf8' }}>{suggestedProject.name}</b> — add to that folder?
            </p>
            <button
              onClick={() => assignProject.mutate({ meetingId: id, projectId: suggestedProject.id })}
              style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            >Yes</button>
            <button
              onClick={() => dismissSuggestion.mutate(id)}
              style={{ display: 'flex', padding: 4, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: C.text3 }}
            ><X style={{ width: 14, height: 14 }} /></button>
          </div>
        )}

        {/* Project badge + picker */}
        {isDone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentProject && (
              <Link href={`/projects/${currentProject.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: currentProject.color + '18', border: `1px solid ${currentProject.color}40`, color: currentProject.color }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                <FolderOpen style={{ width: 12, height: 12 }} />{currentProject.name}
              </Link>
            )}

            {/* Dropdown trigger */}
            <div ref={pickerRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProjectPicker(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: showProjectPicker ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showProjectPicker ? 'rgba(99,102,241,0.35)' : C.border}`, color: showProjectPicker ? '#818cf8' : C.text2, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { if (!showProjectPicker) { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)' } }}
                onMouseLeave={(e) => { if (!showProjectPicker) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = C.border } }}
              >
                <FolderOpen style={{ width: 11, height: 11 }} />
                {currentProject ? 'Move folder' : 'Add to folder'}
              </button>

              {/* Dropdown */}
              {showProjectPicker && (
                <div
                  style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, minWidth: 200, borderRadius: 12, background: '#1a1a2e', border: `1px solid rgba(99,102,241,0.25)`, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden' }}
                >
                  {projects.length === 0 ? (
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                      <p style={{ fontSize: 12, color: C.text3, margin: 0, textAlign: 'center' }}>No projects yet.</p>
                      <Link href="/projects" onClick={() => setShowProjectPicker(false)}
                        style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', textDecoration: 'none' }}>
                        + Create a project
                      </Link>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, padding: '10px 14px 6px' }}>Choose folder</p>
                      {projects.map((p: any) => (
                        <button key={p.id} onClick={() => { assignProject.mutate({ meetingId: id, projectId: p.id }); setShowProjectPicker(false) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: meeting?.folder_id === p.id ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = meeting?.folder_id === p.id ? 'rgba(99,102,241,0.1)' : 'transparent')}
                        >
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: C.text1 }}>{p.name}</span>
                          {meeting?.folder_id === p.id && <Check style={{ width: 12, height: 12, color: '#818cf8', marginLeft: 'auto' }} />}
                        </button>
                      ))}
                      {currentProject && (
                        <>
                          <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
                          <button onClick={() => { assignProject.mutate({ meetingId: id, projectId: null }); setShowProjectPicker(false) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <X style={{ width: 11, height: 11, color: '#f87171' }} />
                            <span style={{ fontSize: 13, color: '#f87171' }}>Remove from folder</span>
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        {isDone && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderRadius: 12, padding: 4, background: C.card, border: `1px solid ${C.border}` }}>
              {TABS.map(({ id: t, label, icon: Icon, hint }) => (
                <Tip key={t} pos="below" text={hint} style={{ flex: 1, display: 'flex' }}>
                  <button onClick={() => setTab(t)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: tab === t ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent', color: tab === t ? '#fff' : C.text3, boxShadow: tab === t ? '0 2px 8px rgba(99,102,241,0.25)' : 'none' }}>
                    <Icon style={{ width: 13, height: 13 }} />{label}
                  </button>
                </Tip>
              ))}
            </div>

            {tab === 'protocol' && (
              <ProtocolTab
                protocol={protocol}
                actionStatuses={actionStatuses}
                onCycleActionStatus={cycleActionStatus}
              />
            )}
            {tab === 'transcript' && (
              <TranscriptTab
                transcript={transcript}
                mediaUrl={media.mediaUrl}
                activeTurnIndex={activeTurnIndex}
                replayMode={replayMode}
                onToggleReplay={() => setReplayMode(r => !r)}
                onSeekTo={media.seekTo}
                speakerStats={speakerStats}
                speakerName={speakerName}
                onRenameClick={(spk) => setRenamingSpk(spk)}
              />
            )}
            {tab === 'analytics' && (
              <AnalyticsTab
                protocol={protocol}
                transcript={transcript}
                speakerStats={speakerStats}
                duration={media.duration}
                mediaUrl={media.mediaUrl}
                onSeekTo={media.seekTo}
                onSetTab={(t) => setTab(t as Tab)}
                speakerName={speakerName}
                onRenameClick={(spk) => setRenamingSpk(spk)}
              />
            )}
            {tab === 'document' && (
              <DocumentTab
                protocol={protocol}
                meeting={meeting}
                notes={notes}
                onUpdateNote={updateNote}
                onExport={exportDOCX}
                docEdits={docEdits}
                onDocEdit={updateDocEdit}
                speakerTurns={transcript?.speaker_turns as any[] ?? []}
                speakerName={speakerName}
                templates={templates}
              />
            )}
          </>
        )}
      </div>

      {/* Speaker rename modal */}
      {renamingSpk && (
        <SpeakerRenameModal
          speaker={renamingSpk}
          displayName={speakerName(renamingSpk)}
          hasCustomName={!!speakerNames[renamingSpk]}
          onSave={(name) => saveSpeakerName(renamingSpk, name)}
          onClear={() => saveSpeakerName(renamingSpk, '')}
          onClose={() => setRenamingSpk(null)}
        />
      )}
    </div>
  )
}
