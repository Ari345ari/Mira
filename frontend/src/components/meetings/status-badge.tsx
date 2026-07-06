'use client'

import { Loader2, AlertCircle } from 'lucide-react'
import { MeetingStatus } from '@/types'

const PROCESSING_STATUSES = new Set([
  MeetingStatus.QUEUED, MeetingStatus.UPLOADING, MeetingStatus.TRANSCRIBING,
  MeetingStatus.ANALYZING, MeetingStatus.GENERATING_PROTOCOL, MeetingStatus.DIARIZING,
])

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  if (status === MeetingStatus.DONE) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
        Completed
      </span>
    )
  }

  if (status === MeetingStatus.FAILED) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>
        <AlertCircle style={{ width: 11, height: 11 }} />Failed
      </span>
    )
  }

  if (PROCESSING_STATUSES.has(status)) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }}>
        <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
        {status.replace(/_/g, ' ')}
      </span>
    )
  }

  return null
}
