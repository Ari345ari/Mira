'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format, isPast, isWithinInterval, addDays, parseISO, isValid } from 'date-fns'
import { CheckSquare, Square, Loader2, AlertCircle, Clock, CheckCheck, Inbox } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'
import { useActionItems, useUpdateActionStatus } from '@/hooks/use-meetings'
import { C } from '@/components/meetings/constants'

const PRIORITY_COLOR: Record<string, string> = {
  high: '#f87171', medium: '#fb923c', low: '#60a5fa',
}

function parseDue(due: string | null): Date | null {
  if (!due) return null
  const d = parseISO(due)
  return isValid(d) ? d : null
}

type Group = 'overdue' | 'due_soon' | 'open' | 'done'

function groupItem(item: any): Group {
  if (item.status === 'done') return 'done'
  const due = parseDue(item.due_date)
  if (!due) return 'open'
  if (isPast(due)) return 'overdue'
  if (isWithinInterval(due, { start: new Date(), end: addDays(new Date(), 7) })) return 'due_soon'
  return 'open'
}

const GROUP_META: Record<Group, { label: string; color: string; icon: any; desc: string }> = {
  overdue:  { label: 'Overdue',   color: '#f87171', icon: AlertCircle, desc: 'Past their due date' },
  due_soon: { label: 'Due Soon',  color: '#fb923c', icon: Clock,       desc: 'Due within 7 days' },
  open:     { label: 'Open',      color: '#818cf8', icon: Square,      desc: 'No due date or upcoming' },
  done:     { label: 'Completed', color: '#34d399', icon: CheckCheck,  desc: '' },
}

const GROUP_ORDER: Group[] = ['overdue', 'due_soon', 'open', 'done']

export default function ActionsPage() {
  const { activeWsId } = useWorkspaceStore()
  const { data: items = [], isLoading } = useActionItems(activeWsId)
  const updateStatus = useUpdateActionStatus()
  const [showDone, setShowDone] = useState(false)
  const [filterOwner, setFilterOwner] = useState('')

  const owners = useMemo(() => {
    const s = new Set<string>()
    items.forEach((i: any) => { if (i.owner) s.add(i.owner) })
    return Array.from(s).sort()
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((i: any) => !filterOwner || i.owner === filterOwner)
  }, [items, filterOwner])

  const grouped = useMemo(() => {
    const g: Record<Group, any[]> = { overdue: [], due_soon: [], open: [], done: [] }
    filtered.forEach((i: any) => g[groupItem(i)].push(i))
    return g
  }, [filtered])

  function toggle(item: any) {
    if (!activeWsId) return
    updateStatus.mutate({
      workspaceId: activeWsId,
      meetingId:   item.meeting_id,
      index:       item.item_index,
      status:      item.status === 'done' ? 'open' : 'done',
    })
  }

  const openCount = grouped.overdue.length + grouped.due_soon.length + grouped.open.length
  const doneCount = grouped.done.length

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text1, margin: 0, letterSpacing: '-0.03em' }}>Action Items</h1>
          <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>
            {isLoading ? 'Loading…' : `${openCount} open · ${doneCount} completed across all meetings`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {owners.length > 0 && (
            <select
              value={filterOwner}
              onChange={e => setFilterOwner(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text2, cursor: 'pointer', outline: 'none' }}
            >
              <option value="">All owners</option>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          <button
            onClick={() => setShowDone(v => !v)}
            style={{ padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: showDone ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showDone ? 'rgba(52,211,153,0.3)' : C.border}`, color: showDone ? '#34d399' : C.text3, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {showDone ? 'Hide completed' : `Show completed (${doneCount})`}
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
        </div>
      )}

      {!isLoading && openCount === 0 && doneCount === 0 && (
        <div style={{ textAlign: 'center', padding: '72px 0' }}>
          <Inbox style={{ width: 36, height: 36, color: C.text3, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text2, margin: '0 0 6px' }}>No action items yet</p>
          <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>Action items from your meeting protocols will appear here.</p>
        </div>
      )}

      {!isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {GROUP_ORDER.filter(g => g !== 'done' || showDone).map(group => {
            const list = grouped[group]
            if (!list.length) return null
            const meta = GROUP_META[group]
            const Icon = meta.icon
            return (
              <div key={group}>
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Icon style={{ width: 13, height: 13, color: meta.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 11, color: C.text3, fontWeight: 600, background: 'rgba(255,255,255,0.06)', padding: '1px 7px', borderRadius: 99 }}>
                    {list.length}
                  </span>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {list.map((item: any) => {
                    const due = parseDue(item.due_date)
                    const isDone = item.status === 'done'
                    return (
                      <div
                        key={`${item.meeting_id}-${item.item_index}`}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', borderRadius: 12, background: C.card, border: `1px solid ${isDone ? 'rgba(255,255,255,0.04)' : C.border}`, opacity: isDone ? 0.6 : 1, transition: 'opacity 0.15s' }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggle(item)}
                          disabled={updateStatus.isPending}
                          style={{ flexShrink: 0, marginTop: 1, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: isDone ? '#34d399' : C.text3, transition: 'color 0.15s' }}
                          onMouseEnter={(e) => { if (!isDone) e.currentTarget.style.color = '#818cf8' }}
                          onMouseLeave={(e) => { if (!isDone) e.currentTarget.style.color = C.text3 }}
                        >
                          {isDone
                            ? <CheckSquare style={{ width: 17, height: 17 }} />
                            : <Square style={{ width: 17, height: 17 }} />}
                        </button>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: isDone ? C.text3 : C.text1, margin: '0 0 5px', textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.4 }}>
                            {item.task}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            {item.owner && (
                              <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>
                                👤 {item.owner}
                              </span>
                            )}
                            {due && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: group === 'overdue' ? '#f87171' : group === 'due_soon' ? '#fb923c' : C.text3 }}>
                                📅 {format(due, 'MMM d, yyyy')}
                                {group === 'overdue' && ' — overdue'}
                              </span>
                            )}
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: `${PRIORITY_COLOR[item.priority] ?? '#818cf8'}18`, color: PRIORITY_COLOR[item.priority] ?? '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {item.priority}
                            </span>
                          </div>
                        </div>

                        {/* Source meeting */}
                        <Link href={`/meetings/${item.meeting_id}`}
                          style={{ flexShrink: 0, fontSize: 11, color: C.text3, textDecoration: 'none', textAlign: 'right', maxWidth: 160 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = C.text3)}
                        >
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                            {item.meeting_title}
                          </span>
                          <span style={{ display: 'block', marginTop: 2 }}>
                            {format(new Date(item.meeting_date), 'MMM d')}
                          </span>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
