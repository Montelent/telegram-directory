'use client'

import { useEffect, useState } from 'react'

const FIELDS = [
  { key: 'site_name', label: 'Site name', type: 'text' },
  { key: 'default_seo_title', label: 'Default SEO title', type: 'text' },
  { key: 'default_seo_description', label: 'Default SEO description', type: 'textarea' },
  { key: 'header_scripts', label: 'Header scripts (Analytics, verification, etc.)', type: 'code' },
  { key: 'footer_scripts', label: 'Footer scripts', type: 'code' },
  { key: 'ad_slot_header', label: 'Ad slot: Header (HTML)', type: 'code' },
  { key: 'ad_slot_sidebar', label: 'Ad slot: Sidebar (HTML)', type: 'code' },
  { key: 'ad_slot_in_content', label: 'Ad slot: In-content (HTML)', type: 'code' },
  { key: 'ad_slot_footer', label: 'Ad slot: Footer (HTML)', type: 'code' },
] as const

export default function AdminSettingsPage() {
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
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: values }),
    })
    setSaving(false)
    setMsg(res.ok ? 'Saved.' : 'Failed to save. Run site_settings SQL migration.')
  }

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Site settings</h1>
      <p className="text-sm text-slate-500 mb-6">
        Ads HTML slots, header/footer scripts (Google Analytics, Search Console, etc.), default SEO.
      </p>

      <div className="space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="text-sm font-medium text-slate-700">{f.label}</label>
            {f.type === 'textarea' || f.type === 'code' ? (
              <textarea
                value={values[f.key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                rows={f.type === 'code' ? 5 : 2}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono"
                placeholder={f.type === 'code' ? '<!-- paste HTML / script tags -->' : ''}
              />
            ) : (
              <input
                value={values[f.key] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            )}
          </div>
        ))}
      </div>

      {msg && <p className="text-sm mt-4 text-slate-600">{msg}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white font-medium disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save settings'}
      </button>
    </div>
  )
}
