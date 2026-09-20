'use client'

import { useEffect, useState } from 'react'

interface Integration {
  id: string
  name: string
  key: string
  isActive: boolean
  lastUsedAt: string | null
}

export default function AdminIntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([])
  const [name, setName] = useState('telegramchannels')
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [phrase, setPhrase] = useState('')
  const [username, setUsername] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [syncing, setSyncing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/integrations')
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function save() {
    if (!name || !key) return
    const res = await fetch('/api/admin/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, key }),
    })
    if (res.ok) {
      setKey('')
      await load()
    }
  }

  async function syncLookup() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/admin/integrations/telegramchannels/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'lookup', username }),
      })
      const data = await res.json()
      if (!res.ok) setSyncMsg(data.error || 'Failed')
      else setSyncMsg(`Imported: ${data.imported?.join(', ')}`)
    } catch {
      setSyncMsg('Network error')
    } finally {
      setSyncing(false)
    }
  }

  async function syncSearch() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/admin/integrations/telegramchannels/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'search', phrase, importLimit: 15 }),
      })
      const data = await res.json()
      if (!res.ok) setSyncMsg(data.error || 'Failed')
      else setSyncMsg(`Imported ${data.count} channels: ${data.imported?.slice(0, 5).join(', ')}…`)
    } catch {
      setSyncMsg('Network error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">API Integrations</h1>
      <p className="text-sm text-slate-500 mb-6">
        Connect telegramchannels.me (and others). Store the API key here, then import channels.
      </p>

      <div className="bg-white rounded-xl border p-5 mb-6 space-y-3">
        <h2 className="font-semibold">Add / update API key</h2>
        <p className="text-xs text-slate-500">
          Use name <code className="bg-slate-100 px-1 rounded">telegramchannels</code> for the
          telegramchannels.me API. Base URL: https://telegramchannels.me/api
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. telegramchannels)"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="API key"
          className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
        />
        <button
          onClick={save}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium"
        >
          Save key
        </button>
      </div>

      <div className="bg-white rounded-xl border p-5 mb-6 space-y-4">
        <h2 className="font-semibold">Import from telegramchannels.me</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (e.g. dailychannels)"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            onClick={syncLookup}
            disabled={syncing || !username}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Lookup & import
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Search phrase (e.g. crypto)"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            onClick={syncSearch}
            disabled={syncing || !phrase}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Search & import
          </button>
        </div>
        {syncMsg && <p className="text-sm text-slate-600">{syncMsg}</p>}
        <p className="text-xs text-slate-400">
          Costs credits on telegramchannels.me (getMediumInfo ≈ $0.0005, searchMedia ≈ $0.001).
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500 text-sm">No keys saved yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="bg-white border rounded-lg px-4 py-3 text-sm flex justify-between">
              <span className="font-medium">{i.name}</span>
              <span className="text-slate-400 truncate max-w-[50%]">{i.key.slice(0, 8)}…</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
