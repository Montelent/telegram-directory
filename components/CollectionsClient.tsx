'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Col = { id: string; name: string; description: string; items: string[] }

export default function CollectionsClient({
  initial,
  mediaOptions,
}: {
  initial: Col[]
  mediaOptions: { username: string; title: string | null }[]
}) {
  const router = useRouter()
  const [cols, setCols] = useState(initial)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        setLoading(false)
        return
      }
      setName('')
      setDescription('')
      setCols((c) => [data.collection, ...c])
      router.refresh()
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  async function addItem(collectionId: string, username: string) {
    if (!username) return
    const res = await fetch('/api/user/collections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: collectionId, addUsername: username }),
    })
    if (res.ok) {
      const data = await res.json()
      setCols((list) => list.map((c) => (c.id === collectionId ? data.collection : c)))
    }
  }

  async function removeCol(id: string) {
    if (!confirm('Delete this collection?')) return
    await fetch('/api/user/collections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCols((list) => list.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="bg-white rounded-2xl border border-[#f0e0e0] p-5 space-y-3">
        <h2 className="font-semibold text-[#2d0808]">New collection</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Collection name"
          required
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-[#8b1a1a] to-[#4a0e0e] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create collection'}
        </button>
      </form>

      {cols.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#f0e0e0] p-10 text-center text-sm text-[#6b5555]">
          No collections yet. Create one above.
        </div>
      ) : (
        <ul className="space-y-4">
          {cols.map((c) => (
            <li key={c.id} className="bg-white rounded-2xl border border-[#f0e0e0] p-5">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold text-[#2d0808]">{c.name}</h3>
                  {c.description && <p className="text-xs text-[#6b5555] mt-0.5">{c.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removeCol(c.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
              <ul className="mt-3 space-y-1">
                {(c.items || []).map((u) => (
                  <li key={u} className="text-sm text-[#5c4040]">
                    @{u}
                  </li>
                ))}
                {(!c.items || c.items.length === 0) && (
                  <li className="text-xs text-slate-400">No channels in this collection</li>
                )}
              </ul>
              {mediaOptions.length > 0 && (
                <div className="mt-3 flex gap-2">
                  <select
                    id={`add-${c.id}`}
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Add media…
                    </option>
                    {mediaOptions.map((m) => (
                      <option key={m.username} value={m.username}>
                        {m.title || m.username} (@{m.username})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`add-${c.id}`) as HTMLSelectElement
                      if (el?.value) addItem(c.id, el.value)
                    }}
                    className="rounded-lg bg-[#1a2332] px-3 py-2 text-xs text-white font-medium"
                  >
                    Add
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
