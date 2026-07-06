'use client'

import { Loader2, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { formatTime } from '@/lib/format'
import { SPEAKER_COLORS } from './constants'
import type { MediaPlayerState } from '@/hooks/use-media-player'

interface MediaPlayerProps extends MediaPlayerState {
  speakerTurns: any[]
  speakerStats: { speaker: string }[]
}

export function MediaPlayer({ ref, mediaUrl, isVideo, isPlaying, currentTime, duration, speed, speakerTurns, speakerStats, togglePlay, seekTo, skip, setPlaybackSpeed }: MediaPlayerProps) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: '#12121c', border: '1px solid rgba(255,255,255,0.06)' }}>
      {isVideo
        ? <video ref={ref as any} src={mediaUrl ?? undefined} style={{ width: '100%', maxHeight: 280, background: '#000', display: 'block' }} controls={false} preload="metadata" />
        : <audio ref={ref} src={mediaUrl ?? undefined} preload="metadata" />
      }

      <div style={{ padding: '16px 20px' }}>
        {/* Scrubber */}
        <div
          style={{ marginBottom: 12, position: 'relative', height: 6, cursor: 'pointer', borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            seekTo(((e.clientX - rect.left) / rect.width) * duration)
          }}
        >
          <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #6366f1, #818cf8)', width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transition: 'width 0.1s linear' }} />
          {/* Speaker colour segments */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden', borderRadius: 3, opacity: 0.4, pointerEvents: 'none' }}>
            {speakerTurns.map((t, i) => {
              const idx = speakerStats.findIndex(s => s.speaker === t.speaker)
              const color = SPEAKER_COLORS[idx % SPEAKER_COLORS.length]
              return (
                <div key={i} style={{ position: 'absolute', height: '100%', left: `${(t.start / duration) * 100}%`, width: `${((t.end - t.start) / duration) * 100}%`, background: color.bar }} />
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => skip(-10)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.38)', transition: 'color 0.1s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}>
              <SkipBack style={{ width: 14, height: 14 }} />
            </button>

            <button onClick={togglePlay} disabled={!mediaUrl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)', border: 'none', cursor: 'pointer', color: '#fff' }}>
              {!mediaUrl
                ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                : isPlaying
                ? <Pause style={{ width: 15, height: 15 }} />
                : <Play style={{ width: 15, height: 15, marginLeft: 2 }} />
              }
            </button>

            <button onClick={() => skip(10)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.38)', transition: 'color 0.1s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}>
              <SkipForward style={{ width: 14, height: 14 }} />
            </button>

            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
              {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
            </span>
          </div>

          {/* Speed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Volume2 style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.38)', marginRight: 4 }} />
            {[0.75, 1, 1.25, 1.5, 2].map((s) => (
              <button key={s} onClick={() => setPlaybackSpeed(s)} style={{ padding: '3px 7px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.1s', background: speed === s ? 'rgba(99,102,241,0.2)' : 'transparent', color: speed === s ? '#818cf8' : 'rgba(255,255,255,0.38)' }}>
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
