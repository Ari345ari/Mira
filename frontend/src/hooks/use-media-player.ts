'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import api from '@/lib/api'

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
    let url = ''
    let cancelled = false
    api.get(`/meetings/${meetingId}/media`, { responseType: 'blob', timeout: 60000 })
      .then(r => {
        if (cancelled) return
        setIsVideo(r.data.type?.startsWith('video/'))
        url = URL.createObjectURL(r.data)
        setMediaUrl(url)
      })
      .catch(() => { if (!cancelled) setMediaError(true) })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
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
