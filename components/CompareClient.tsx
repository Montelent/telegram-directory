'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type PoolItem = {
  id: string
  title: string
  username: string | null
  memberCount: number | null
  type?: string
}
type Entity = {
  id: string
  title: string
  username: string | null
  memberCount: number | null
  language: string | null
  country: string | null
  type: string
  isVerified: boolean
  isFeatured?: boolean
  description: string | null
  category?: { name: string; slug: string } | null
}

export default function CompareClient({
  pool,
  initialSelected,
}: {
  pool: PoolItem[]
  initialSelected: Entity[]
}) {
  const [slots, setSlots] = useState<(string | '')[]>([
    initialSelected[0]?.id || '',
    initialSelected[1]?.id || '',
    initialSelected[2]?.id || '',
  ])
  const [queries, setQueries] = useState(['', '', ''])
  const [suggestions, setSuggestions] = useState<PoolItem[][]>([[], [], []])
  const [loaded, setLoaded] = useState<Record<string, Entity>>(() => {
    const m: Record<string, Entity> = {}
    for (const e of initialSelected) m[e.id] = e
    return m
  })
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState<number | null>(null)

  async function searchSlot(index: number, q: string) {
    const nextQ = [...queries]
    nextQ[index] = q
    setQueries(nextQ)

    if (!q.trim()) {
      const nextS = [...suggestions]
      nextS[index] = []
      setSuggestions(nextS)
      return
    }

    setSearching(index)
    try {
      const res = await fetch(
        '/api/entities/search?q=' + encodeURIComponent(q.trim()) + '&limit=12'
      )
      if (res.ok) {
        const data = await res.json()
        const nextS = [...suggestions]
        nextS[index] = data.results || []
        setSuggestions(nextS)
      }
    } catch {
      /* */
    }
    setSearching(null)
  }

  function pick(index: number, item: PoolItem | Entity) {
    const next = [...slots] as (string | '')[]
    next[index] = item.id
    setSlots(next)
    if ('type' in item && item.title) {
      setLoaded((m) => ({
        ...m,
        [item.id]: {
          id: item.id,
          title: item.title,
          username: item.username,
          memberCount: item.memberCount,
          language: (item as Entity).language ?? null,
          country: (item as Entity).country ?? null,
          type: (item as Entity).type || 'CHANNEL',
          isVerified: (item as Entity).isVerified ?? false,
          isFeatured: (item as Entity).isFeatured,
          description: (item as Entity).description ?? null,
          category: (item as Entity).category,
        },
      }))
    }
    const nextQ = [...queries]
    nextQ[index] = item.username ? '@' + item.username : item.title
    setQueries(nextQ)
    const nextS = [...suggestions]
    nextS[index] = []
    setSuggestions(nextS)
  }

  async function loadMissing() {
    setLoading(true)
    const need = slots.filter((id) => id && !loaded[id]) as string[]
    for (const id of need) {
      try {
        const res = await fetch('/api/entities/' + id)
        if (res.ok) {
          const data = await res.json()
          setLoaded((m) => ({ ...m, [id]: data }))
        }
      } catch {
        /* */
      }
    }
    setLoading(false)
  }

  const entities = useMemo(() => {
    return slots.map((id) => (id ? loaded[id] || null : null))
  }, [slots, loaded])

  const rows: { label: string; get: (e: Entity) => string }[] = [
    { label: 'Title', get: (e) => e.title },
    { label: 'Username', get: (e) => (e.username ? '@' + e.username : '—') },
    { label: 'Type', get: (e) => e.type },
    {
      label: 'Subscribers',
      get: (e) => (e.memberCount != null ? e.memberCount.toLocaleString() : '—'),
    },
    { label: 'Language', get: (e) => e.language || '—' },
    { label: 'Country', get: (e) => e.country || '—' },
    { label: 'Category', get: (e) => e.category?.name || '—' },
    { label: 'Verified', get: (e) => (e.isVerified ? 'Yes' : 'No') },
    { label: 'Featured', get: (e) => (e.isFeatured ? 'Yes' : 'No') },
  ]

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 relative">
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Slot {i + 1} — channel / group / bot
            </label>
            <input
              value={queries[i]}
              onChange={(e) => searchSlot(i, e.target.value)}
              placeholder="Search @username, title or id…"
              className="w-full mt-1 rounded-lg border border-slate-200 px-2 py-2 text-sm"
              autoComplete="off"
            />
            {searching === i && (
              <p className="text-[10px] text-slate-400 mt-1">Searching…</p>
            )}
            {suggestions[i].length > 0 && (
              <ul className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {suggestions[i].map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => pick(i, s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between gap-2"
                    >
                      <span className="truncate">
                        {s.title}{' '}
                        <span className="text-slate-400">
                          {s.username ? '@' + s.username : ''}
                        </span>
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {s.memberCount != null ? s.memberCount.toLocaleString() : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <select
              value={slots[i]}
              onChange={(e) => {
                const next = [...slots] as (string | '')[]
                next[i] = e.target.value
                setSlots(next)
                const p = pool.find((x) => x.id === e.target.value)
                if (p) {
                  const nq = [...queries]
                  nq[i] = p.username ? '@' + p.username : p.title
                  setQueries(nq)
                }
              }}
              className="w-full mt-2 rounded-lg border border-slate-200 px-2 py-2 text-sm"
            >
              <option value="">Or pick from top list…</option>
              {pool.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}{' '}
                  {p.memberCount != null ? '(' + p.memberCount.toLocaleString() + ')' : ''}
                </option>
              ))}
            </select>
            {slots[i] && (
              <button
                type="button"
                onClick={() => {
                  const next = [...slots] as (string | '')[]
                  next[i] = ''
                  setSlots(next)
                  const nq = [...queries]
                  nq[i] = ''
                  setQueries(nq)
                }}
                className="text-[11px] text-red-600 mt-1"
              >
                Clear slot
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={loadMissing}
        disabled={loading}
        className="rounded-xl bg-[#1a2332] text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-50"
      >
        {loading ? 'Loading…' : 'Compare'}
      </button>

      {entities.some(Boolean) && (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 text-slate-500 font-medium w-32">Metric</th>
                {entities.map((e, i) => (
                  <th key={i} className="text-left p-3 font-semibold text-slate-900">
                    {e ? (
                      <Link href={'/entity/' + e.id} className="hover:text-[#0088cc]">
                        {e.title}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-slate-50">
                  <td className="p-3 text-slate-500 text-xs font-semibold uppercase">{row.label}</td>
                  {entities.map((e, i) => (
                    <td key={i} className="p-3 text-slate-800">
                      {e ? row.get(e) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
