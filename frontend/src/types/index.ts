export enum MeetingStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  VALIDATING = 'validating',
  QUEUED = 'queued',
  EXTRACTING_AUDIO = 'extracting_audio',
  TRANSCRIBING = 'transcribing',
  DIARIZING = 'diarizing',
  ANALYZING = 'analyzing',
  GENERATING_PROTOCOL = 'generating_protocol',
  DONE = 'done',
  FAILED = 'failed',
}

export enum MeetingLanguage {
  MN = 'mn',
  EN = 'en',
  MIXED = 'mixed',
}

export interface Meeting {
  id: string
  title: string
  meeting_date: string
  duration_seconds: number | null
  participants: string[]
  status: MeetingStatus
  language: MeetingLanguage | null
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  preferred_language: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
}
