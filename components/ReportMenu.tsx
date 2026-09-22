'use client'

import { useState } from 'react'

const REASONS = [
  { id: 'dislike', label: "I don't like", icon: '👎' },
  { id: 'broken', label: 'Broken', icon: '🔗' },
  { id: 'copyright', label: 'Copyright', icon: '©' },
  { id: 'nsfw', label: 'NSFW', icon: '👁' },
  { id: 'wrong_category', label: 'Wrong Category', icon: '📁' },
  { id: 'wrong_language', label: 'Wrong Language', icon: '文A' },
] as const

export default function ReportMenu({
  entityId,
  title,
}: {
  entityId: string
  title: string
}) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function report(reason: string) {
    setLoading(true)
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, reason, title }),
      })
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setSent(false)
      }, 1500)
    } catch {
      /* */
    }
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-red-500 hover:bg-slate-50 shadow-sm"
        aria-label="Report"
        title="Report"
      >
        <span className="text-sm font-bold">⚑</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 overflow-hidden">
            {sent ? (
              <p className="px-4 py-6 text-center text-sm text-emerald-600 font-medium">
                Report sent. Thank you.
              </p>
            ) : (
              REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={loading}
                  onClick={() => report(r.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left disabled:opacity-50"
                >
                  <span className="w-5 text-center opacity-70">{r.icon}</span>
                  {r.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
