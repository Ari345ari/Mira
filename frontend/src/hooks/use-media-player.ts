'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/store/auth'

export function useMediaPlayer(meetingId: string, enabled: boolean) {
  const ref = useRef<HTMLVideoElement>(null)
  const [mediaUrl, setMediaUrl]   = useState<string | null>(null)
  const [isVideo, setIsVideo]     = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]   = useState(0)
  const [mediaError, setMediaError] = useState(false)
  const [speed, setSpeed]         = useState(1)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const token = useAuthStore.getState().accessToken
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
    const url = `${base}/meetings/${meetingId}/media?token=${encodeURIComponent(token ?? '')}`
    // HEAD first just to read Content-Type — the actual media loads via native
    // <video>/<audio> streaming (with Range support) instead of a full blob fetch
    fetch(url, { method: 'HEAD' })
      .then(r => {
        if (cancelled) return
        setIsVideo((r.headers.get('content-type') ?? '').startsWith('video/'))
        setMediaUrl(url)
      })
      .catch(() => { if (!cancelled) setMediaError(true) })
    return () => { cancelled = true }
  }, [enabled, meetingId])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onTime  = () => setCurrentTime(el.currentTime)
    const onPlay  = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onMeta  = () => setDuration(el.duration)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('loadedmetadata', onMeta)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('loadedmetadata', onMeta)
    }
  }, [mediaUrl])

  const togglePlay = useCallback(() => {
    const el = ref.current
    if (!el) return
    isPlaying ? el.pause() : el.play()
  }, [isPlaying])

  const seekTo = useCallback((time: number) => {
    if (ref.current) { ref.current.currentTime = time; ref.current.play() }
  }, [])

  const skip = useCallback((delta: number) => {
    if (ref.current) ref.current.currentTime += delta
  }, [])

  const setPlaybackSpeed = useCallback((s: number) => {
    setSpeed(s)
    if (ref.current) ref.current.playbackRate = s
  }, [])

  const activeTurnIndex = useMemo(() => -1, []) // placeholder; consumer passes speaker_turns

  return {
    ref, mediaUrl, isVideo, isPlaying, currentTime, duration, mediaError, speed,
    togglePlay, seekTo, skip, setPlaybackSpeed, activeTurnIndex,
  }
}

export type MediaPlayerState = ReturnType<typeof useMediaPlayer>
