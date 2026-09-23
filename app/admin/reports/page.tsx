'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ReportRow {
  id: string
  entityId: string
  reason: string
  title?: string | null
  status: string
  notes?: string | null
  createdAt: string
  entity?: { title?: string; username?: string | null; type?: string; status?: string } | null
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/reports')
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Failed')
      setReports(Array.isArray(data.reports) ? data.reports : [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function setStatus(id: string, status: string) {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this report?')) return
    await fetch(`/api/admin/reports?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Reports</h1>
      <p className="text-sm text-slate-500 mb-6">User flags on channels, groups, and bots</p>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-500">No reports yet.</div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {reports.map((r) => (
            <div key={r.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {r.title || r.entity?.title || r.entityId}
                  {r.entity?.username ? (
                    <span className="text-slate-400 font-normal"> @{r.entity.username}</span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">
                  Reason: <strong>{r.reason}</strong> · {r.status} ·{' '}
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                </p>
              </div>
              <div className="flex gap-2 text-xs shrink-0">
                {r.entityId && (
                  <Link
                    href={`/entity/${r.entityId}`}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                  >
                    View
                  </Link>
                )}
                {r.status === 'open' && (
                  <button onClick={() => setStatus(r.id, 'reviewed')} className="text-emerald-600 hover:underline">
                    Mark reviewed
                  </button>
                )}
                {r.status !== 'dismissed' && (
                  <button onClick={() => setStatus(r.id, 'dismissed')} className="text-slate-500 hover:underline">
                    Dismiss
                  </button>
                )}
                <button onClick={() => remove(r.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
