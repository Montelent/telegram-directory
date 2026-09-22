'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'tgdir_visitor_id'

export default function OnlineBadge({ className = '' }: { className?: string }) {
  const [online, setOnline] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let interval: ReturnType<typeof setInterval>

    async function beat() {
      try {
        let vid = ''
        try {
          vid = localStorage.getItem(STORAGE_KEY) || ''
        } catch {
          /* */
        }
        const res = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId: vid }),
        })
        const data = await res.json()
        if (cancelled) return
        if (data.visitorId) {
          try {
            localStorage.setItem(STORAGE_KEY, data.visitorId)
          } catch {
            /* */
          }
        }
        if (typeof data.online === 'number') setOnline(data.online)
      } catch {
        if (!cancelled) setOnline(1)
      }
    }

    beat()
    interval = setInterval(beat, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span>
        {online == null ? '…' : online.toLocaleString()} online
      </span>
    </span>
  )
}
