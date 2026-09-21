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

function formatCount(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const mode = searchParams.get('sort') || 'search' // members | rating | search
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [entities, setEntities] = useState<Entity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  const title =
    mode === 'members'
      ? 'Ranking'
      : mode === 'rating'
        ? 'Rating'
        : mode === 'trending'
          ? 'Trending'
          : 'Search'

  const subtitle =
    mode === 'members'
      ? 'Top channels & groups by subscribers'
      : mode === 'rating'
        ? 'Highest rated communities'
        : mode === 'trending'
          ? 'Channels gaining attention'
          : 'Find public Telegram groups and channels'

  async function fetchData(page = 1) {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type) params.set('type', type)
    if (category) params.set('category', category)
    if (mode === 'members' || mode === 'rating' || mode === 'trending') {
      params.set('sort', mode === 'trending' ? 'members' : mode)
    }
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
      if (catsRes.ok) setCategories(await catsRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, category, mode])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (type) params.set('type', type)
    if (category) params.set('category', category)
    if (mode !== 'search') params.set('sort', mode)
    router.push(`/search?${params.toString()}`)
    fetchData(1)
  }

  return (
    <main className="min-h-screen bg-[#faf4f4]">
      <div className="bg-gradient-to-r from-[#2d0808] via-[#4a0e0e] to-[#8b1a1a] text-white">
        <div className="container mx-auto px-4 py-10">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#f0c8c8] mb-1">{title}</p>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-[#f0c8c8] text-sm mb-6">{subtitle}</p>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or @username…"
              className="flex-1 rounded-xl border-0 px-4 py-3 text-sm text-[#1a1212] focus:outline-none focus:ring-2 focus:ring-[#c41e3a]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#c41e3a] hover:bg-[#a31830] px-6 py-3 text-sm font-semibold text-white"
            >
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-2 mt-4 text-xs">
            {[
              { label: 'All', sort: '' },
              { label: 'Ranking', sort: 'members' },
              { label: 'Trending', sort: 'trending' },
              { label: 'Rating', sort: 'rating' },
            ].map((t) => (
              <Link
                key={t.label}
                href={t.sort ? `/search?sort=${t.sort}` : '/search'}
                className={`rounded-full px-3 py-1 transition ${
                  (mode === 'search' && !t.sort) || mode === t.sort
                    ? 'bg-white text-[#4a0e0e] font-semibold'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-52 shrink-0 space-y-5">
            <div className="bg-white rounded-xl border border-[#f0e0e0] p-4">
              <h3 className="font-semibold text-xs text-[#6b5555] uppercase tracking-wide mb-2">Type</h3>
              <div className="space-y-1">
                {['', 'GROUP', 'CHANNEL'].map((t) => (
                  <button
                    key={t || 'all'}
                    onClick={() => setType(t)}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${
                      type === t
                        ? 'bg-[#f8e8e8] text-[#8b1a1a] font-medium'
                        : 'text-[#5c4040] hover:bg-[#faf4f4]'
                    }`}
                  >
                    {t === '' ? 'All' : t === 'GROUP' ? 'Groups' : 'Channels'}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#f0e0e0] p-4">
              <h3 className="font-semibold text-xs text-[#6b5555] uppercase tracking-wide mb-2">Category</h3>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                <button
                  onClick={() => setCategory('')}
                  className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${
                    category === ''
                      ? 'bg-[#f8e8e8] text-[#8b1a1a] font-medium'
                      : 'text-[#5c4040] hover:bg-[#faf4f4]'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${
                      category === cat.slug
                        ? 'bg-[#f8e8e8] text-[#8b1a1a] font-medium'
                        : 'text-[#5c4040] hover:bg-[#faf4f4]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <p className="text-[#6b5555]">Loading…</p>
            ) : entities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#f0e0e0] p-12 text-center text-[#6b5555]">
                No results found.
              </div>
            ) : (
              <>
                <p className="text-sm text-[#6b5555] mb-4">{pagination.total} results</p>
                <div className="space-y-3">
                  {entities.map((entity, i) => (
                    <Link
                      key={entity.id}
                      href={`/entity/${entity.id}`}
                      className="flex gap-4 bg-white rounded-2xl border border-[#f0e0e0] p-4 hover:border-[#c41e3a]/40 hover:shadow-sm transition"
                    >
                      {(mode === 'members' || mode === 'rating' || mode === 'trending') && (
                        <div className="w-8 text-center pt-3 text-sm font-bold text-[#c41e3a]">
                          #{(pagination.page - 1) * 20 + i + 1}
                        </div>
                      )}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#f8e8e8] to-[#f0d0d0] flex items-center justify-center text-xl shrink-0">
                        {entity.type === 'CHANNEL' ? '📢' : '👥'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-[#2d0808]">{entity.title}</h3>
                          <span className="text-[10px] font-bold uppercase text-[#8b1a1a] bg-[#f8e8e8] px-1.5 py-0.5 rounded">
                            {entity.type}
                          </span>
                        </div>
                        {entity.username && (
                          <p className="text-sm text-[#8b1a1a]">@{entity.username}</p>
                        )}
                        {entity.description && (
                          <p className="text-sm text-[#6b5555] mt-1 line-clamp-2">{entity.description}</p>
                        )}
                        <div className="flex gap-3 mt-1 text-[11px] text-[#6b5555]">
                          {entity.memberCount != null && (
                            <span>{formatCount(entity.memberCount)} members</span>
                          )}
                          {entity.category && <span>{entity.category.name}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
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
    <Suspense fallback={<div className="p-10 text-center text-[#6b5555]">Loading…</div>}>
      <SearchContent />
    </Suspense>
  )
}
