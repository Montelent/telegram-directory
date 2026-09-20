'use client'

import { useEffect, useState } from 'react'

export default function AdminScriptsPage() {
  const [header, setHeader] = useState('')
  const [footer, setFooter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || {}
        setHeader(s.header_scripts || '')
        setFooter(s.footer_scripts || '')
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          header_scripts: header,
          footer_scripts: footer,
        },
      }),
    })
    setSaving(false)
    setMsg(res.ok ? 'Scripts saved.' : 'Failed to save.')
  }

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Header & Footer scripts</h1>
      <p className="text-sm text-slate-500 mb-6">
        Paste verification codes, Google Analytics, Tag Manager, Meta pixel, Search Console, etc.
      </p>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium">Header scripts</label>
          <p className="text-xs text-slate-400 mb-1">Injected inside &lt;head&gt;</p>
          <textarea
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            rows={8}
            className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
            placeholder={'<!-- Google tag (gtag.js) -->\n<script>...</script>'}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Footer scripts</label>
          <p className="text-xs text-slate-400 mb-1">Injected before end of body</p>
          <textarea
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            rows={8}
            className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
            placeholder="<!-- chat widgets, etc. -->"
          />
        </div>
      </div>

      {msg && <p className="text-sm mt-4 text-slate-600">{msg}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white font-medium disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save scripts'}
      </button>
    </div>
  )
}
