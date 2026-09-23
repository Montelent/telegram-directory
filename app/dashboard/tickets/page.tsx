'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/tickets')
    const data = await res.json()
    setTickets(Array.isArray(data.tickets) ? data.tickets : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function openTicket(id: string) {
    const res = await fetch(`/api/tickets/${id}`)
    if (res.ok) setActive(await res.json())
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!active || !reply.trim()) return
    const res = await fetch(`/api/tickets/${active.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: reply }),
    })
    if (res.ok) {
      setReply('')
      openTicket(active.id)
      load()
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Support tickets</h1>

      {active ? (
        <div className="bg-white rounded-2xl border p-4 space-y-3">
          <button type="button" onClick={() => setActive(null)} className="text-xs text-blue-600 hover:underline">
            ← All tickets
          </button>
          <h2 className="font-semibold">{active.subject}</h2>
          <p className="text-xs text-slate-400">{active.status}</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(active.messages || []).map((m: any) => (
              <div
                key={m.id}
                className={`rounded-xl px-3 py-2 text-sm ${
                  m.isAdmin ? 'bg-[#f8e8e8]' : 'bg-slate-50'
                }`}
              >
                <p className="text-[10px] text-slate-400 mb-0.5">
                  {m.isAdmin ? 'Support' : 'You'} · {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
          {active.status === 'OPEN' && (
            <form onSubmit={sendReply} className="space-y-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Reply…"
              />
              <button type="submit" className="rounded-lg bg-[#1a2332] text-white text-sm px-4 py-2">
                Send
              </button>
            </form>
          )}
        </div>
      ) : loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border p-6 text-center text-slate-500 text-sm">
          No tickets yet. Use the chat button to contact support.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border divide-y">
          {tickets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openTicket(t.id)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50"
            >
              <p className="font-medium text-sm">{t.subject}</p>
              <p className="text-xs text-slate-400">
                {t.status} · {new Date(t.updatedAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
