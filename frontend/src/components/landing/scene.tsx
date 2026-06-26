'use client'

import { useEffect, useRef } from 'react'

const BAR_COUNT = 32

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let mx = 0.5
    let rafId: number
    let t = 0

    const onMouse = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth
    }

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('resize', resize)
    resize()

    function animate() {
      rafId = requestAnimationFrame(animate)
      t += 0.012

      const W = canvas!.offsetWidth
      const H = canvas!.offsetHeight
      ctx.clearRect(0, 0, W, H)

      const gap    = W * 0.007
      const barW   = (W - gap * (BAR_COUNT - 1)) / BAR_COUNT
      const step   = barW + gap
      const startX = 0
      const cy     = H * 0.52
      const maxH   = H * 0.44

      for (let i = 0; i < BAR_COUNT; i++) {
        const norm = i / (BAR_COUNT - 1)
        const x    = startX + i * step

        // Shape: taller in center, like the logo mark
        const arch = 1 - Math.abs(norm - 0.5) * 1.6
        const base = maxH * Math.max(0.08, arch)

        // Multi-frequency animation
        const wave =
          Math.sin(norm * Math.PI * 2.5 + t * 1.4) * 0.3 +
          Math.sin(norm * Math.PI * 4.2 + t * 0.9) * 0.18 +
          Math.sin(norm * Math.PI * 1.1 + t * 2.1) * 0.12

        // Mouse influence: gaussian bump at cursor x
        const mouseDist = Math.abs(norm - mx) * 2.8
        const mouseBoost = Math.exp(-mouseDist * mouseDist) * 0.9

        const h = Math.max(4, base * (0.45 + wave * 0.55 + 0.55) + maxH * mouseBoost * 0.6)
        const bx = x
        const by = cy - h / 2

        // Opacity: brighter near mouse and in center
        const baseAlpha = 0.22 + arch * 0.35
        const alpha = Math.min(0.98, baseAlpha + mouseBoost * 0.55)

        // Vertical gradient per bar
        const grad = ctx.createLinearGradient(bx, by, bx, by + h)
        grad.addColorStop(0,   `rgba(167,139,250,${alpha * 0.85})`)
        grad.addColorStop(0.4, `rgba(129,140,248,${alpha})`)
        grad.addColorStop(1,   `rgba(79,70,229,${alpha * 0.5})`)

        roundRect(ctx, bx, by, barW, h, barW / 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Glow on hover
        if (mouseBoost > 0.15) {
          ctx.save()
          ctx.shadowBlur  = 18 * mouseBoost
          ctx.shadowColor = `rgba(99,102,241,${mouseBoost * 0.7})`
          roundRect(ctx, bx, by, barW, h, barW / 2)
          ctx.fillStyle = grad
          ctx.fill()
          ctx.restore()
        }
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}
