'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TicketWidget() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (pathname?.startsWith('/admin')) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        setSending(false)
        return
      }
      setDone(true)
      setSubject('')
      setMessage('')
      setSending(false)
    } catch {
      setError('Network error')
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setDone(false)
          setError('')
        }}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#8b1a1a] hover:bg-[#6b1414] text-white shadow-lg flex items-center justify-center text-2xl transition"
        aria-label="Support chat"
        title="Support"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[min(100vw-2rem,22rem)] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
          <div className="bg-[#8b1a1a] text-white px-4 py-3">
            <p className="font-semibold text-sm">Support</p>
            <p className="text-[11px] text-white/80">We typically reply within a day</p>
          </div>
          <div className="p-4">
            {status === 'loading' ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : !session || (session.user as any)?.role !== 'user' ? (
              <div className="text-sm text-slate-600 space-y-2">
                <p>Log in to open a support ticket.</p>
                <Link href="/login?callbackUrl=/" className="text-[#8b1a1a] font-medium hover:underline">
                  Log in →
                </Link>
              </div>
            ) : done ? (
              <div className="text-sm text-emerald-700 space-y-2">
                <p className="font-medium">Ticket submitted!</p>
                <p>Track replies in your dashboard.</p>
                <Link href="/dashboard/tickets" className="text-[#8b1a1a] font-medium hover:underline">
                  View my tickets →
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-2">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  minLength={3}
                  placeholder="Subject"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={5}
                  rows={4}
                  placeholder="How can we help?"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-lg bg-[#8b1a1a] text-white text-sm font-semibold py-2.5 disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send ticket'}
                </button>
                <Link href="/dashboard/tickets" className="block text-center text-xs text-slate-500 hover:underline">
                  My tickets
                </Link>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
