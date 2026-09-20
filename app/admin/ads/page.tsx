'use client'

import { useEffect, useState } from 'react'

const SLOTS = [
  { key: 'ad_slot_header', label: 'Header banner', hint: 'Top of every public page' },
  { key: 'ad_slot_sidebar', label: 'Sidebar', hint: 'Search / listing side column' },
  { key: 'ad_slot_in_content', label: 'In-content', hint: 'Between content blocks' },
  { key: 'ad_slot_footer', label: 'Footer banner', hint: 'Above footer scripts' },
  { key: 'ad_slot_entity', label: 'Entity detail', hint: 'On group/channel detail page' },
] as const

export default function AdminAdsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setValues(d.settings || {}))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMsg('')
    const settings: Record<string, string> = {}
    for (const s of SLOTS) settings[s.key] = values[s.key] || ''
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    })
    setSaving(false)
    setMsg(res.ok ? 'Ad slots saved.' : 'Failed to save.')
  }

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Ads</h1>
      <p className="text-sm text-slate-500 mb-6">
        Paste AdSense, banner HTML, or affiliate codes into each slot. Leave empty to hide.
      </p>

      <div className="space-y-6">
        {SLOTS.map((s) => (
          <div key={s.key} className="bg-white rounded-xl border p-4">
            <label className="text-sm font-medium">{s.label}</label>
            <p className="text-xs text-slate-400 mb-2">{s.hint}</p>
            <textarea
              value={values[s.key] || ''}
              onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              placeholder="<!-- ad code -->"
            />
          </div>
        ))}
      </div>

      {msg && <p className="text-sm mt-4 text-slate-600">{msg}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white font-medium disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save ad slots'}
      </button>
    </div>
  )
}
