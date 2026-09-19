'use client'

import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Submission {
  id: string
  username: string
  title: string | null
  description: string | null
  type: 'GROUP' | 'CHANNEL'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'
  notes: string | null
  createdAt: string
  entityId: string | null
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Record<string, string>>({})

  async function loadData() {
    setLoading(true)
    try {
      const [subsRes, catsRes] = await Promise.all([
        fetch('/api/admin/submissions'),
        fetch('/api/admin/categories'),
      ])

      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubmissions(data)
      }
      if (catsRes.ok) {
        const data = await catsRes.json()
        setCategories(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          categoryId: selectedCategory[id] || undefined,
        }),
      })

      if (res.ok) {
        await loadData()
      } else {
        const data = await res.json()
        alert(data.error || 'Action failed')
      }
    } catch {
      alert('Network error')
    } finally {
      setProcessing(null)
    }
  }

  const filtered = submissions.filter((s) =>
    filter === 'ALL' ? true : s.status === filter
  )

  return (
    <div>
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Submission Queue</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
              {f === 'PENDING' && (
                <span className="ml-1.5 text-xs opacity-80">
                  ({submissions.filter((s) => s.status === 'PENDING').length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
            No submissions found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-xl border p-5 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg">
                        @{sub.username}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          sub.type === 'CHANNEL'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {sub.type}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          sub.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : sub.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    {sub.title && (
                      <p className="text-slate-800 font-medium">{sub.title}</p>
                    )}
                    {sub.description && (
                      <p className="text-slate-600 text-sm mt-1">{sub.description}</p>
                    )}

                    <p className="text-xs text-slate-400 mt-2">
                      Submitted {new Date(sub.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {sub.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <select
                        value={selectedCategory[sub.id] || ''}
                        onChange={(e) =>
                          setSelectedCategory((prev) => ({
                            ...prev,
                            [sub.id]: e.target.value,
                          }))
                        }
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      >
                        <option value="">No category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(sub.id, 'approve')}
                          disabled={processing === sub.id}
                          className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing === sub.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(sub.id, 'reject')}
                          disabled={processing === sub.id}
                          className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
