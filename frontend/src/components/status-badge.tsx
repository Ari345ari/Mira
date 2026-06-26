import { MeetingStatus } from '@/types'

const PROCESSING = new Set([
  MeetingStatus.UPLOADING,
  MeetingStatus.VALIDATING,
  MeetingStatus.QUEUED,
  MeetingStatus.EXTRACTING_AUDIO,
  MeetingStatus.TRANSCRIBING,
  MeetingStatus.DIARIZING,
  MeetingStatus.ANALYZING,
  MeetingStatus.GENERATING_PROTOCOL,
])

const config: Record<MeetingStatus, { label: string; dot: string; text: string; bg: string }> = {
  [MeetingStatus.PENDING]:             { label: 'Pending',      dot: 'bg-zinc-400',   text: 'text-zinc-600',  bg: 'bg-zinc-100' },
  [MeetingStatus.UPLOADING]:           { label: 'Uploading',    dot: 'bg-blue-500',   text: 'text-blue-700',  bg: 'bg-blue-50' },
  [MeetingStatus.VALIDATING]:          { label: 'Validating',   dot: 'bg-blue-500',   text: 'text-blue-700',  bg: 'bg-blue-50' },
  [MeetingStatus.QUEUED]:              { label: 'Queued',       dot: 'bg-amber-400',  text: 'text-amber-700', bg: 'bg-amber-50' },
  [MeetingStatus.EXTRACTING_AUDIO]:    { label: 'Processing',   dot: 'bg-amber-400',  text: 'text-amber-700', bg: 'bg-amber-50' },
  [MeetingStatus.TRANSCRIBING]:        { label: 'Transcribing', dot: 'bg-amber-400',  text: 'text-amber-700', bg: 'bg-amber-50' },
  [MeetingStatus.DIARIZING]:           { label: 'Diarizing',    dot: 'bg-amber-400',  text: 'text-amber-700', bg: 'bg-amber-50' },
  [MeetingStatus.ANALYZING]:           { label: 'Analyzing',    dot: 'bg-violet-500', text: 'text-violet-700',bg: 'bg-violet-50' },
  [MeetingStatus.GENERATING_PROTOCOL]: { label: 'Generating',   dot: 'bg-violet-500', text: 'text-violet-700',bg: 'bg-violet-50' },
  [MeetingStatus.DONE]:                { label: 'Done',         dot: 'bg-emerald-500',text: 'text-emerald-700',bg: 'bg-emerald-50' },
  [MeetingStatus.FAILED]:              { label: 'Failed',       dot: 'bg-red-500',    text: 'text-red-700',   bg: 'bg-red-50' },
}

export default function StatusBadge({ status }: { status: MeetingStatus }) {
  const { label, dot, text, bg } = config[status]
  const pulsing = PROCESSING.has(status)

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${bg} ${text}`}>
      <span className={`relative h-1.5 w-1.5 rounded-full ${dot}`}>
        {pulsing && <span className={`absolute inset-0 rounded-full ${dot} animate-ping opacity-75`} />}
      </span>
      {label}
    </span>
  )
}
