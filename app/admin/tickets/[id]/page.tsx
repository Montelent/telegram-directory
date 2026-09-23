'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [ticket, setTicket] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets/${params.id}`)
      if (!res.ok) {
        setError('Not found')
        return
      }
      setTicket(await res.json())
    } catch {
      setError('Failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [params.id])

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    const res = await fetch(`/api/admin/tickets/${params.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: reply }),
    })
    setSending(false)
    if (res.ok) {
      setReply('')
      load()
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to send')
    }
  }

  async function setStatus(status: 'OPEN' | 'CLOSED') {
    await fetch(`/api/admin/tickets/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  async function remove() {
    if (!confirm('Delete this ticket permanently?')) return
    await fetch(`/api/admin/tickets/${params.id}`, { method: 'DELETE' })
    router.push('/admin/tickets')
  }

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>
  if (!ticket) return <div className="p-6 text-red-600">{error || 'Not found'}</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Link href="/admin/tickets" className="text-xs text-slate-500 hover:underline">
        ← Tickets
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mt-1 mb-4">
        <div>
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <p className="text-xs text-slate-500">
            {ticket.user?.email || 'User'} · {ticket.status}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {ticket.status === 'OPEN' ? (
            <button
              onClick={() => setStatus('CLOSED')}
              className="rounded-lg border px-3 py-1.5 font-medium"
            >
              Close
            </button>
          ) : (
            <button
              onClick={() => setStatus('OPEN')}
              className="rounded-lg border px-3 py-1.5 font-medium"
            >
              Reopen
            </button>
          )}
          <button onClick={remove} className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 font-medium">
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
        {(ticket.messages || []).map((m: any) => (
          <div
            key={m.id}
            className={`rounded-xl px-3 py-2 text-sm ${
              m.isAdmin ? 'bg-[#f8e8e8] ml-6' : 'bg-slate-50 mr-6'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase text-slate-400 mb-0.5">
              {m.isAdmin ? 'Support' : m.authorName || 'User'} ·{' '}
              {new Date(m.createdAt).toLocaleString()}
            </p>
            <p className="whitespace-pre-wrap text-slate-800">{m.body}</p>
          </div>
        ))}
        {(!ticket.messages || ticket.messages.length === 0) && (
          <p className="text-sm text-slate-500 whitespace-pre-wrap">{ticket.message}</p>
        )}
      </div>

      {ticket.status === 'OPEN' && (
        <form onSubmit={sendReply} className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Write a reply…"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send reply'}
          </button>
        </form>
      )}
    </div>
  )
}
