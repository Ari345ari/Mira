'use client'

import { useRef, useState } from 'react'
import { useWorkspaceStore } from '@/store/workspace'
import { useWorkspaces } from '@/hooks/use-meetings'
import { useWorkspaceFiles, useUploadWorkspaceFile, useDeleteWorkspaceFile } from '@/hooks/use-meetings'
import { Upload, Trash2, Download, Loader2, File, Users, Lock, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import api from '@/lib/api'

const WS_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444']
function wsColor(name: string) { return WS_COLORS[(name?.charCodeAt(0) ?? 0) % WS_COLORS.length] }
function wsInitial(name: string) { return (name ?? '?').charAt(0).toUpperCase() }

const C = {
  bg: '#0d0d14', card: '#111118', surface: '#15141f',
  border: 'rgba(255,255,255,0.07)',
  text1: '#f1f0ff', text2: 'rgba(255,255,255,0.65)', text3: 'rgba(255,255,255,0.35)',
  accent: '#6366f1', accentHi: '#818cf8',
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return '🖼'
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('audio/')) return '🎵'
  if (mime.includes('pdf')) return '📄'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return '📊'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return '📊'
  if (mime.includes('word') || mime.includes('document')) return '📝'
  if (mime.includes('zip') || mime.includes('archive')) return '📦'
  return '📎'
}

export default function FilesPage() {
  const { activeWsId } = useWorkspaceStore()
  const { data: workspaces } = useWorkspaces()
  const { user } = useAuthStore()

  const currentWs = workspaces?.find((w: any) => w.id === activeWsId)
  const wsId = activeWsId

  // Solo workspace = personal (only 1 member, the owner)
  const memberCount = currentWs?.members?.length ?? 1
  const isPersonal = memberCount <= 1
  const contextLabel = isPersonal ? 'My Files' : 'Shared Files'

  const { data: files = [], isLoading } = useWorkspaceFiles(wsId)
  const uploadMut  = useUploadWorkspaceFile()
  const deleteMut  = useDeleteWorkspaceFile()

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !wsId) return
    const arr = Array.from(fileList)
    for (const f of arr) {
      try {
        await uploadMut.mutateAsync({ workspaceId: wsId, file: f })
        toast.success(`${f.name} uploaded`)
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? `Failed to upload ${f.name}`)
      }
    }
  }

  async function handleDownload(fileId: string, name: string) {
    if (!wsId) return
    setDownloading(fileId)
    try {
      const res = await api.get(`/workspaces/${wsId}/files/${fileId}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(null)
    }
  }

  async function handleDelete(fileId: string, name: string) {
    if (!wsId) return
    try {
      await deleteMut.mutateAsync({ workspaceId: wsId, fileId })
      toast.success(`${name} deleted`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not delete file')
    }
  }

  return (
    <div style={{ minHeight: '100%', background: C.bg, padding: 32 }}>

      {/* ── Context header ── */}
      <div style={{ marginBottom: 28 }}>
        {/* Workspace badge */}
        {currentWs && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, width: 'fit-content' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: wsColor(currentWs.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {wsInitial(currentWs.name)}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.text1, margin: 0 }}>{currentWs.name}</p>
              <p style={{ fontSize: 11, color: C.text3, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                {isPersonal
                  ? <><Lock style={{ width: 10, height: 10 }} />Personal workspace</>
                  : <><Users style={{ width: 10, height: 10 }} />{memberCount} members</>
                }
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: 0, letterSpacing: '-0.03em' }}>{contextLabel}</h1>
            <p style={{ fontSize: 13, color: C.text3, margin: '4px 0 0' }}>
              {isPersonal
                ? 'Files you\'ve uploaded to your personal workspace'
                : `Files shared with everyone in ${currentWs?.name ?? 'this workspace'}`
              }
            </p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Upload style={{ width: 14, height: 14 }} />
            Upload files
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

      {/* ── Drop zone ── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        style={{
          marginBottom: 24,
          border: `2px dashed ${dragging ? C.accent : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 14,
          padding: '28px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          background: dragging ? 'rgba(99,102,241,0.05)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <Upload style={{ width: 22, height: 22, color: dragging ? C.accentHi : C.text3 }} />
        <p style={{ fontSize: 13, color: dragging ? C.accentHi : C.text3, margin: 0, fontWeight: 500 }}>
          {dragging ? 'Drop to upload' : 'Drag & drop files here, or click to browse'}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>Any file type supported</p>
      </div>

      {/* ── File list ── */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 11, width: 200, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ height: 9, width: 120, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (files as any[]).length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen style={{ width: 22, height: 22, color: C.accentHi }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.text1, margin: 0 }}>No files yet</p>
          <p style={{ fontSize: 13, color: C.text3, margin: 0, textAlign: 'center' }}>
            {isPersonal ? 'Upload files to keep them organised in your personal workspace.' : 'Upload files to share them with your team.'}
          </p>
        </div>
      )}

      {!isLoading && (files as any[]).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(files as any[]).map((f: any) => {
            const isMe = f.uploader?.id === user?.id
            return (
              <div
                key={f.id}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
              >
                {/* File type icon */}
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {fileIcon(f.mime_type)}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                  <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{fmtSize(f.size)}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{fmtDate(f.created_at)}</span>
                    {!isPersonal && f.uploader && (
                      <>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span style={{ color: isMe ? C.accentHi : C.text3 }}>
                          {isMe ? 'You' : f.uploader.full_name}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => handleDownload(f.id, f.name)}
                    disabled={downloading === f.id}
                    title="Download"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, borderRadius: 8, color: C.text3, display: 'flex', transition: 'color 0.15s, background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.accentHi; e.currentTarget.style.background = 'rgba(99,102,241,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.text3; e.currentTarget.style.background = 'none' }}
                  >
                    {downloading === f.id
                      ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                      : <Download style={{ width: 14, height: 14 }} />
                    }
                  </button>
                  {isMe && (
                    <button
                      onClick={() => handleDelete(f.id, f.name)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 7, borderRadius: 8, color: 'rgba(255,255,255,0.2)', display: 'flex', transition: 'color 0.15s, background 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'none' }}
                    >
                      {deleteMut.isPending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Trash2 style={{ width: 14, height: 14 }} />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
