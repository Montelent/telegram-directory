'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function RankShareActions({
  entityId,
  title,
  username,
}: {
  entityId: string
  title: string
  username?: string | null
}) {
  const [copied, setCopied] = useState(false)

  async function shareRankCard() {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/entity/${entityId}`
        : `/entity/${entityId}`
    const text = `${title}${username ? ` (@${username})` : ''} — Telegram Directory`

    try {
      if (navigator.share) {
        await navigator.share({ title: text, url, text })
        return
      }
    } catch {
      /* fall through to copy */
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* */
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
          href={`/compare?a=${entityId}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2.5 transition"
        >
          <span className="opacity-60">▥</span> Compare
        </Link>
        <button
          type="button"
          onClick={shareRankCard}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2.5 transition"
        >
          <span className="opacity-60">↗</span> {copied ? 'Link copied!' : 'Share rank card'}
        </button>
      </div>
    </div>
  )
}
