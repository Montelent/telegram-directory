'use client'

import { useEffect, useState } from 'react'

interface Integration {
  id: string
  name: string
  key: string
  isActive: boolean
  lastUsedAt: string | null
  metadata: any
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [tgstatToken, setTgstatToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/integrations')
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data)
        const tg = data.find((i: Integration) => i.name === 'TGStat')
        if (tg) setTgstatToken(tg.key || '')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function saveTgstat() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'TGStat',
          key: tgstatToken,
          isActive: !!tgstatToken,
        }),
      })
      if (res.ok) {
        setMessage('TGStat token saved successfully')
        await load()
      } else {
        setMessage('Failed to save')
      }
    } catch {
      setMessage('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">API Integrations</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* TGStat */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">TGStat API</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enrich entities with subscriber counts, categories, and discovery data from TGStat.
              </p>
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Placeholder
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">API Token</label>
              <input
                type="password"
                value={tgstatToken}
                onChange={(e) => setTgstatToken(e.target.value)}
                placeholder="Your TGStat API token"
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">
                Get a token at{' '}
                <a
                  href="https://api.tgstat.ru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  api.tgstat.ru
                </a>
                . Free tier is very limited.
              </p>
            </div>

            <button
              onClick={saveTgstat}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Token'}
            </button>

            {message && (
              <p className="text-sm text-green-600">{message}</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t text-sm text-slate-500">
            <p className="font-medium text-slate-700 mb-1">Planned features:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Fetch channel/group stats (subscribers, reach)</li>
              <li>Auto-categorize using TGStat categories</li>
              <li>Discover similar channels</li>
              <li>Background sync jobs</li>
            </ul>
          </div>
        </div>

        {/* Future: Telethon crawler */}
        <div className="bg-white rounded-xl border p-6 opacity-75">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="font-semibold text-lg">Telethon Crawler</h2>
              <p className="text-sm text-slate-500 mt-1">
                Background worker that discovers new public groups via keyword search and link extraction.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
              Future
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Will run as a separate Python service using Telethon (MTProto).
          </p>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading saved integrations...</p>}
      </div>
    </div>
  )
}
