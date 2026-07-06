export const LANG: Record<string, string> = { mn: 'Mongolian', en: 'English', mixed: 'Mixed' }

export const C = {
  card:     '#12121c',
  border:   'rgba(255,255,255,0.06)',
  surface:  'rgba(255,255,255,0.03)',
  text1:    '#f1f5f9',
  text2:    'rgba(255,255,255,0.65)',
  text3:    'rgba(255,255,255,0.38)',
  accent:   '#6366f1',
  accentHi: '#818cf8',
} as const

export const SPEAKER_COLORS = [
  { bg: 'rgba(99,102,241,0.08)',  text: '#818cf8', bar: '#6366f1' },
  { bg: 'rgba(245,158,11,0.08)', text: '#fbbf24', bar: '#f59e0b' },
  { bg: 'rgba(16,185,129,0.08)', text: '#34d399', bar: '#10b981' },
  { bg: 'rgba(239,68,68,0.08)',  text: '#f87171', bar: '#ef4444' },
] as const

export const ACTION_STATUSES = ['todo', 'in-progress', 'done', 'blocked'] as const
export type ActionStatus = typeof ACTION_STATUSES[number]

export const ACTION_STATUS_CONFIG: Record<ActionStatus, { label: string; color: string; bg: string; border: string; sym: string }> = {
  'todo':        { label: 'To Do',       color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', sym: '○' },
  'in-progress': { label: 'In Progress', color: '#fbbf24',                bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)', sym: '◑' },
  'done':        { label: 'Done',        color: '#34d399',                bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)', sym: '●' },
  'blocked':     { label: 'Blocked',     color: '#f87171',                bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',  sym: '✕' },
}
