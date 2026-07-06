'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { FolderOpen, Plus, Loader2, Trash2, X, Check } from 'lucide-react'
import { useWorkspaceStore } from '@/store/workspace'
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/use-meetings'
import { C } from '@/components/meetings/constants'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']

export default function ProjectsPage() {
  const { activeWsId: wsId } = useWorkspaceStore()

  const { data: projects = [], isLoading } = useProjects(wsId)
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()

  const [showForm, setShowForm] = useState(false)
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [color, setColor]       = useState('#6366f1')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId || !name.trim()) return
    try {
      await createProject.mutateAsync({ workspaceId: wsId, name: name.trim(), description: desc.trim() || undefined, color })
      toast.success('Project created')
      setName(''); setDesc(''); setColor('#6366f1'); setShowForm(false)
    } catch { toast.error('Failed to create project') }
  }

  async function handleDelete(id: string, pName: string) {
    if (!confirm(`Delete "${pName}"? Meetings will be unassigned.`)) return
    try {
      await deleteProject.mutateAsync(id)
      toast.success('Project deleted')
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text1, margin: 0, letterSpacing: '-0.03em' }}>Projects</h1>
          <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>Organize meetings into folders by project or topic</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
        >
          <Plus style={{ width: 14, height: 14 }} />New project
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ borderRadius: 14, padding: '20px 22px', background: C.card, border: `1px solid rgba(99,102,241,0.3)`, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text1, margin: 0 }}>New project</p>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3 }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
          <input
            autoFocus required value={name} onChange={e => setName(e.target.value)}
            placeholder="Project name"
            style={{ padding: '9px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text1, outline: 'none' }}
          />
          <input
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Description (optional) — helps AI categorize meetings"
            style={{ padding: '9px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text1, outline: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: C.text3, marginRight: 4 }}>Color:</span>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, background: 'transparent', border: `1px solid ${C.border}`, color: C.text3, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={createProject.isPending} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              <Check style={{ width: 13, height: 13 }} />{createProject.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '56px 0' }}>
          <Loader2 style={{ width: 18, height: 18, color: C.accent }} className="animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <FolderOpen style={{ width: 36, height: 36, color: C.text3, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text2, margin: '0 0 6px' }}>No projects yet</p>
          <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>Create a project to start organizing your meetings into folders.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {projects.map((p: any) => (
            <div key={p.id} style={{ position: 'relative' }}>
              <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  style={{ borderRadius: 14, padding: '20px 20px', background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = p.color + '60'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.transform = '' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FolderOpen style={{ width: 18, height: 18, color: p.color }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 99, padding: '2px 9px', background: 'rgba(255,255,255,0.06)', color: C.text3 }}>
                      {p.meeting_count} meeting{p.meeting_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text1, margin: '0 0 4px' }}>{p.name}</p>
                  {p.description && <p style={{ fontSize: 12, color: C.text3, margin: '0 0 10px', lineHeight: 1.5 }}>{p.description}</p>}
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                    Created {format(new Date(p.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => handleDelete(p.id, p.name)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4, borderRadius: 6, transition: 'color 0.1s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
