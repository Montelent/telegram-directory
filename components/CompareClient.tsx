'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type PoolItem = { id: string; title: string; username: string | null; memberCount: number | null }
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
  const [loaded, setLoaded] = useState<Record<string, Entity>>(() => {
    const m: Record<string, Entity> = {}
    for (const e of initialSelected) m[e.id] = e
    return m
  })
  const [loading, setLoading] = useState(false)

  async function loadMissing() {
    setLoading(true)
    const need = slots.filter((id) => id && !loaded[id]) as string[]
    for (const id of need) {
      try {
        const res = await fetch(`/api/entities/${id}`)
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
    { label: 'Username', get: (e) => (e.username ? `@${e.username}` : '—') },
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
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3">
            <label className="text-[10px] font-bold uppercase text-slate-400">Channel {i + 1}</label>
            <select
              value={slots[i]}
              onChange={(e) => {
                const next = [...slots] as (string | '')[]
                next[i] = e.target.value
                setSlots(next)
              }}
              className="w-full mt-1 rounded-lg border border-slate-200 px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {pool.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.memberCount != null ? `(${p.memberCount.toLocaleString()})` : ''}
                </option>
              ))}
            </select>
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
                      <Link href={`/entity/${e.id}`} className="hover:text-[#0088cc]">
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
