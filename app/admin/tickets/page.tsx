'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TicketRow {
  id: string
  subject: string
  message: string
  status: string
  updatedAt: string
  user?: { email?: string | null; name?: string | null } | null
  _count?: { messages: number }
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tickets')
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Failed')
      setTickets(Array.isArray(data.tickets) ? data.tickets : [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Support tickets</h1>
      <p className="text-sm text-slate-500 mb-6">User support requests — reply, close, or delete</p>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-500">No tickets yet.</div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{t.subject}</p>
                <p className="text-xs text-slate-500 truncate">
                  {t.user?.email || 'Guest'} · {t.status} · {t._count?.messages ?? 0} messages ·{' '}
                  {new Date(t.updatedAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                  t.status === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {t.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
