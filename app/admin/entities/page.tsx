'use client'

import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
}

interface Entity {
  id: string
  username: string | null
  title: string
  description: string | null
  type: 'GROUP' | 'CHANNEL'
  status: string
  memberCount: number | null
  isVerified: boolean
  isScam: boolean
  category: Category | null
  updatedAt: string
}

export default function AdminEntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (q) params.set('q', q)

    try {
      const [entRes, catRes] = await Promise.all([
        fetch(`/api/admin/entities?${params.toString()}`),
        fetch('/api/admin/categories'),
      ])
      if (entRes.ok) setEntities(await entRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  async function updateStatus(id: string, status: string) {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/entities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) await load()
    } finally {
      setProcessing(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this entity permanently?')) return
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/entities/${id}`, { method: 'DELETE' })
      if (res.ok) await load()
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div>
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Manage Groups & Channels</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search title or username..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            onClick={load}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium"
          >
            Search
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : entities.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
            No entities found.
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Members</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity) => (
                  <tr key={entity.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{entity.title}</div>
                      {entity.username && (
                        <div className="text-xs text-blue-600">@{entity.username}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          entity.type === 'CHANNEL'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {entity.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          entity.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : entity.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {entity.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {entity.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {entity.memberCount?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {entity.status !== 'APPROVED' && (
                        <button
                          onClick={() => updateStatus(entity.id, 'APPROVED')}
                          disabled={processing === entity.id}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Approve
                        </button>
                      )}
                      {entity.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => updateStatus(entity.id, 'ARCHIVED')}
                          disabled={processing === entity.id}
                          className="text-slate-500 hover:underline text-xs"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => remove(entity.id)}
                        disabled={processing === entity.id}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
