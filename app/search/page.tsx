'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  _count?: { entities: number }
}

interface Entity {
  id: string
  username: string | null
  title: string
  description: string | null
  type: 'GROUP' | 'CHANNEL'
  memberCount: number | null
  isVerified: boolean
  photoUrl?: string | null
  category: { name: string; slug: string } | null
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [q, setQ] = useState(searchParams.get('q') || '')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [entities, setEntities] = useState<Entity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  async function fetchData(page = 1) {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type) params.set('type', type)
    if (category) params.set('category', category)
    params.set('page', String(page))

    try {
      const [entitiesRes, catsRes] = await Promise.all([
        fetch(`/api/entities?${params.toString()}`),
        fetch('/api/categories'),
      ])

      if (entitiesRes.ok) {
        const data = await entitiesRes.json()
        setEntities(data.data)
        setPagination(data.pagination)
      }
      if (catsRes.ok) {
        setCategories(await catsRes.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1)
  }, [type, category])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type) params.set('type', type)
    if (category) params.set('category', category)
    router.push(`/search?${params.toString()}`)
    fetchData(1)
  }

  function detailHref(entity: Entity) {
    return entity.username ? `/g/${entity.username}` : `/g/${entity.id}`
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Search Groups & Channels</h1>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, keyword, or @username..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-56 shrink-0 space-y-6">
            <div>
              <h3 className="font-semibold text-sm text-slate-700 mb-2">Type</h3>
              <div className="space-y-1">
                {['', 'GROUP', 'CHANNEL'].map((t) => (
                  <button
                    key={t || 'all'}
                    onClick={() => setType(t)}
                    className={`block w-full text-left px-3 py-1.5 rounded text-sm ${
                      type === t ? 'bg-blue-100 text-blue-800 font-medium' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t === '' ? 'All' : t === 'GROUP' ? 'Groups' : 'Channels'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-slate-700 mb-2">Category</h3>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                <button
                  onClick={() => setCategory('')}
                  className={`block w-full text-left px-3 py-1.5 rounded text-sm ${
                    category === '' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    className={`block w-full text-left px-3 py-1.5 rounded text-sm ${
                      category === cat.slug ? 'bg-blue-100 text-blue-800 font-medium' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.name}
                    {cat._count && <span className="text-slate-400 ml-1">({cat._count.entities})</span>}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : entities.length === 0 ? (
              <div className="bg-white rounded-xl border p-10 text-center text-slate-500">
                No groups or channels found.
                <div className="mt-4">
                  <Link href="/submit" className="text-blue-600 hover:underline">Submit one →</Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  {pagination.total} result{pagination.total !== 1 ? 's' : ''}
                </p>
                <div className="space-y-3">
                  {entities.map((entity) => (
                    <Link
                      key={entity.id}
                      href={detailHref(entity)}
                      className="block bg-white rounded-xl border p-5 hover:border-blue-300 hover:shadow-sm transition"
                    >
                      <div className="flex gap-4">
                        {entity.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={entity.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover border shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xl">
                            {entity.type === 'CHANNEL' ? '📢' : '👥'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{entity.title}</h3>
                            {entity.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              entity.type === 'CHANNEL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>{entity.type}</span>
                          </div>
                          {entity.username && (
                            <p className="text-sm text-blue-600">@{entity.username}</p>
                          )}
                          {entity.description && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{entity.description}</p>
                          )}
                          <div className="flex gap-3 mt-2 text-xs text-slate-400">
                            {entity.category && <span>{entity.category.name}</span>}
                            {entity.memberCount != null && (
                              <span>{entity.memberCount.toLocaleString()} members</span>
                            )}
                          </div>
                          <p className="text-sm text-blue-600 font-medium mt-2">View details & open Telegram →</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => fetchData(pagination.page - 1)}
                      className="px-4 py-2 rounded border text-sm disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchData(pagination.page + 1)}
                      className="px-4 py-2 rounded border text-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}
