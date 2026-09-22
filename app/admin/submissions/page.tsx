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
  language?: string | null
  country?: string | null
  createdAt: string
  entityId: string | null
}

function categorySlugFromNotes(notes: string | null): string | null {
  if (!notes) return null
  const m = notes.match(/Category:\s*([a-z0-9_-]+)/i)
  return m ? m[1].toLowerCase() : null
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

      let cats: Category[] = []
      if (catsRes.ok) {
        cats = await catsRes.json()
        setCategories(cats)
      }

      if (subsRes.ok) {
        const data: Submission[] = await subsRes.json()
        setSubmissions(data)

        // Pre-select category from user's choice in notes
        const pre: Record<string, string> = {}
        for (const s of data) {
          const slug = categorySlugFromNotes(s.notes)
          if (slug) {
            const cat = cats.find((c) => c.slug.toLowerCase() === slug)
            if (cat) pre[s.id] = cat.id
          }
        }
        setSelectedCategory((prev) => ({ ...pre, ...prev }))
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
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-[#2d0808] mb-1">Submission queue</h1>
      <p className="text-sm text-[#6b5555] mb-6">Review media. User-selected category is pre-filled when present.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? 'bg-[#8b1a1a] text-white'
                : 'bg-white border border-[#f0e0e0] text-[#5c4040] hover:bg-[#faf4f4]'
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
        <div className="bg-white rounded-xl border border-[#f0e0e0] p-8 text-center text-slate-500">
          No submissions found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => {
            const requestedSlug = categorySlugFromNotes(sub.notes)
            const requestedCat = categories.find(
              (c) => c.slug.toLowerCase() === (requestedSlug || '')
            )
            return (
              <div key={sub.id} className="bg-white rounded-xl border border-[#f0e0e0] p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-lg text-[#2d0808]">@{sub.username}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {sub.type}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          sub.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : sub.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    {sub.title && <p className="text-slate-800 font-medium">{sub.title}</p>}
                    {sub.description && (
                      <p className="text-slate-600 text-sm mt-1 line-clamp-3">{sub.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {sub.language && (
                        <span className="rounded-full bg-slate-50 border px-2 py-0.5">Lang: {sub.language}</span>
                      )}
                      {sub.country && (
                        <span className="rounded-full bg-slate-50 border px-2 py-0.5">Country: {sub.country}</span>
                      )}
                      {requestedSlug && (
                        <span className="rounded-full bg-[#f8e8e8] text-[#8b1a1a] border border-[#f0d0d0] px-2 py-0.5 font-medium">
                          Requested category: {requestedCat?.name || requestedSlug}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-2">
                      Submitted {new Date(sub.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {sub.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 min-w-[220px]">
                      <label className="text-[10px] font-bold uppercase text-slate-400">Category</label>
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
                            {requestedSlug === cat.slug ? ' (requested)' : ''}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(sub.id, 'approve')}
                          disabled={processing === sub.id}
                          className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
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
            )
          })}
        </div>
      )}
    </div>
  )
}
