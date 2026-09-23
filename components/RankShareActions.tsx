'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function RankShareActions({
  entityId,
  title,
  username,
  memberCount,
  type,
  globalRank,
  publicPath,
}: {
  entityId: string
  title: string
  username?: string | null
  memberCount?: number | null
  type?: string
  globalRank?: number | null
  publicPath?: string
}) {
  const [status, setStatus] = useState('')

  function pageUrl() {
    const path = publicPath || '/entity/' + entityId
    if (typeof window === 'undefined') return path
    return window.location.origin + path
  }

  function formatCount(n: number | null | undefined) {
    if (n == null) return '—'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
    return n.toLocaleString()
  }

  async function downloadRankCard() {
    setStatus('Generating…')
    try {
      const w = 1080
      const h = 1350
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setStatus('Canvas not supported')
        return
      }

      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, '#1a2332')
      grad.addColorStop(0.55, '#2d0808')
      grad.addColorStop(1, '#4a0e0e')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      const g2 = ctx.createRadialGradient(w * 0.8, 0, 0, w * 0.8, 0, w * 0.7)
      g2.addColorStop(0, 'rgba(196,30,58,0.35)')
      g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = 'rgba(255,255,255,0.96)'
      roundRect(ctx, 60, 120, w - 120, h - 280, 40)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 36px system-ui, sans-serif'
      ctx.fillText('Telegram Directory', 60, 80)

      ctx.fillStyle = '#f1f5f9'
      roundRect(ctx, 100, 170, 160, 48, 12)
      ctx.fill()
      ctx.fillStyle = '#475569'
      ctx.font = 'bold 22px system-ui, sans-serif'
      ctx.fillText((type || 'CHANNEL').toUpperCase(), 118, 202)

      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 52px system-ui, sans-serif'
      const titleLines = wrapText(ctx, title, w - 220)
      let y = 280
      for (const line of titleLines.slice(0, 3)) {
        ctx.fillText(line, 100, y)
        y += 62
      }

      if (username) {
        ctx.fillStyle = '#0088cc'
        ctx.font = '600 32px system-ui, sans-serif'
        ctx.fillText('@' + username, 100, y + 20)
        y += 70
      } else {
        y += 30
      }

      const boxY = y + 40
      const boxW = (w - 260) / 2
      ctx.fillStyle = '#f8fafc'
      roundRect(ctx, 100, boxY, boxW, 140, 20)
      ctx.fill()
      roundRect(ctx, 120 + boxW, boxY, boxW, 140, 20)
      ctx.fill()

      ctx.fillStyle = '#94a3b8'
      ctx.font = 'bold 20px system-ui, sans-serif'
      ctx.fillText('SUBSCRIBERS', 120, boxY + 45)
      ctx.fillText('GLOBAL RANK', 140 + boxW, boxY + 45)

      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 44px system-ui, sans-serif'
      ctx.fillText(formatCount(memberCount), 120, boxY + 105)
      ctx.fillText(
        globalRank != null ? '#' + globalRank.toLocaleString() : '—',
        140 + boxW,
        boxY + 105
      )

      const linkY = boxY + 180
      ctx.fillStyle = '#1a2332'
      roundRect(ctx, 100, linkY, w - 200, 100, 20)
      ctx.fill()
      ctx.fillStyle = '#94a3b8'
      ctx.font = '20px system-ui, sans-serif'
      ctx.fillText('View on our directory', 130, linkY + 38)
      ctx.fillStyle = '#ffffff'
      ctx.font = '600 26px system-ui, sans-serif'
      const url = pageUrl()
      const shortUrl = url.length > 42 ? url.slice(0, 40) + '…' : url
      ctx.fillText(shortUrl, 130, linkY + 75)

      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = '22px system-ui, sans-serif'
      ctx.fillText('Share · Discover · Grow', 60, h - 50)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      )
      if (!blob) {
        setStatus('Failed to create image')
        return
      }

      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download =
        (username || title || 'rank-card').replace(/[^a-z0-9_-]/gi, '_') + '-rank-card.png'
      a.click()
      URL.revokeObjectURL(a.href)
      setStatus('Downloaded!')
      setTimeout(() => setStatus(''), 2500)
    } catch {
      setStatus('Download failed')
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <p className="text-xs text-slate-400 mb-3 flex items-start gap-2">
        <span className="opacity-60">▥</span>
        <span>Share your stats or compare with another channel or group</span>
      </p>
      <div className="flex gap-2">
        <Link
          href={'/compare?a=' + entityId}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2.5 transition"
        >
          Compare
        </Link>
        <button
          type="button"
          onClick={downloadRankCard}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2.5 transition"
        >
          {status || 'Share rank card'}
        </button>
      </div>
    </div>
  )
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}
