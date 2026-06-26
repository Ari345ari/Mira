import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import api from '@/lib/api'

const PROCESSING = ['uploading', 'validating', 'queued', 'extracting_audio', 'transcribing', 'diarizing', 'analyzing', 'generating_protocol']

export function useMeetings(workspaceId?: string) {
  return useQuery({
    queryKey: ['meetings', workspaceId],
    queryFn: () =>
      api
        .get('/meetings', { params: { workspaceId } })
        .then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useMeeting(id: string) {
  const qc = useQueryClient()
  const prevStatus = useRef<string | null>(null)

  const query = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => api.get(`/meetings/${id}`).then((r) => r.data),
    refetchInterval: (q) => {
      const data = q.state.data as any
      return data && PROCESSING.includes(data.status) ? 3000 : false
    },
    enabled: !!id,
  })

  const status: string | undefined = query.data?.status

  // When status transitions to 'done', trigger protocol + transcript fetches
  useEffect(() => {
    if (status === 'done' && prevStatus.current !== 'done') {
      qc.invalidateQueries({ queryKey: ['protocol', id] })
      qc.invalidateQueries({ queryKey: ['transcript', id] })
    }
    if (status) prevStatus.current = status
  }, [status, id, qc])

  return query
}

export function useTranscript(meetingId: string, enabled = true) {
  return useQuery({
    queryKey: ['transcript', meetingId],
    queryFn: () => api.get(`/meetings/${meetingId}/transcript`).then((r) => r.data),
    enabled: !!meetingId && enabled,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

export function useProtocol(meetingId: string, enabled = true) {
  return useQuery({
    queryKey: ['protocol', meetingId],
    queryFn: () => api.get(`/meetings/${meetingId}/protocol`).then((r) => r.data),
    enabled: !!meetingId && enabled,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

export function useDeleteMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/meetings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  })
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then((r) => r.data),
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) => api.post('/workspaces', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

// ── Workspace files ───────────────────────────────────────────────────────

export function useWorkspaceFiles(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace-files', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/files`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useUploadWorkspaceFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, file }: { workspaceId: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return api.post(`/workspaces/${workspaceId}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
    },
    onSuccess: (_d, { workspaceId }) => qc.invalidateQueries({ queryKey: ['workspace-files', workspaceId] }),
  })
}

export function useDeleteWorkspaceFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, fileId }: { workspaceId: string; fileId: string }) =>
      api.delete(`/workspaces/${workspaceId}/files/${fileId}`).then((r) => r.data),
    onSuccess: (_d, { workspaceId }) => qc.invalidateQueries({ queryKey: ['workspace-files', workspaceId] }),
  })
}

export function useSearchUsers(workspaceId: string | null, query: string) {
  return useQuery({
    queryKey: ['workspace-user-search', workspaceId, query],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/users/search`, { params: { q: query } }).then((r) => r.data),
    enabled: !!workspaceId && query.trim().length >= 2,
    staleTime: 10000,
  })
}

export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then((r) => r.data),
    enabled: !!workspaceId,
  })
}

export function useMyInvites() {
  return useQuery({
    queryKey: ['my-invites'],
    queryFn: () => api.get('/workspaces/invites/me').then((r) => r.data),
    refetchInterval: 30000, // poll every 30s for new invites
  })
}

export function useRespondToInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ inviteId, action }: { inviteId: string; action: 'accept' | 'decline' }) =>
      api.post(`/workspaces/invites/${inviteId}/respond`, { action }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-invites'] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useCancelInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => api.delete(`/workspaces/invites/${inviteId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace-members'] })
    },
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, email, role }: { workspaceId: string; email: string; role?: string }) =>
      api.post(`/workspaces/${workspaceId}/members`, { email, role }).then((r) => r.data),
    onSuccess: (_d, { workspaceId }) => {
      qc.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      api.delete(`/workspaces/${workspaceId}/members/${userId}`).then((r) => r.data),
    onSuccess: (_d, { workspaceId }) => {
      qc.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, userId, role }: { workspaceId: string; userId: string; role: string }) =>
      api.patch(`/workspaces/${workspaceId}/members/${userId}/role`, { role }).then((r) => r.data),
    onSuccess: (_d, { workspaceId }) => qc.invalidateQueries({ queryKey: ['workspace-members', workspaceId] }),
  })
}
