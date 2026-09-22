'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Deposit = {
  id: string
  amountCents: number
  method: string
  status: string
  reference: string | null
  metadata: string | null
  createdAt: string
  user: { id: string; email: string; name: string | null; balanceCents: number }
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'completed' | 'rejected' | 'all'>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/deposits')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load')
        setDeposits([])
      } else {
        setDeposits(data.deposits || [])
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function act(id: string, action: 'approve' | 'reject') {
    if (action === 'approve' && !confirm('Credit this deposit to the user balance?')) return
    if (action === 'reject' && !confirm('Reject this deposit?')) return
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed')
      } else {
        await load()
      }
    } catch {
      alert('Network error')
    }
    setProcessing(null)
  }

  const filtered = deposits.filter((d) => (filter === 'all' ? true : d.status === filter))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2d0808]">Deposits</h1>
          <p className="text-sm text-[#6b5555]">
            Approve bank / crypto / manual payments. Approving credits the user balance.
          </p>
        </div>
        <Link href="/admin/payments" className="text-sm text-[#8b1a1a] hover:underline">
          Payment method settings →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['pending', 'completed', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              filter === f
                ? 'bg-[#8b1a1a] text-white'
                : 'bg-white border border-[#f0e0e0] text-[#5c4040]'
            }`}
          >
            {f}
            {f === 'pending' && (
              <span className="ml-1 opacity-80">
                ({deposits.filter((d) => d.status === 'pending').length})
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#f0e0e0] p-8 text-center text-slate-500">
          No deposits in this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-[#f0e0e0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[#2d0808]">
                  ${(d.amountCents / 100).toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-500 uppercase">{d.method}</span>
                </p>
                <p className="text-sm text-slate-600 truncate">
                  {d.user?.name || d.user?.email} · balance $
                  {((d.user?.balanceCents ?? 0) / 100).toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ref: {d.reference || '—'} · {new Date(d.createdAt).toLocaleString()}
                </p>
                <span
                  className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    d.status === 'pending'
                      ? 'bg-amber-50 text-amber-700'
                      : d.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {d.status}
                </span>
              </div>

              {d.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={processing === d.id}
                    onClick={() => act(d.id, 'approve')}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white font-medium disabled:opacity-50"
                  >
                    Approve & credit
                  </button>
                  <button
                    type="button"
                    disabled={processing === d.id}
                    onClick={() => act(d.id, 'reject')}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white font-medium disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
