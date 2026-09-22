'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminFooterPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setValues(d.settings || {}))
      .finally(() => setLoading(false))
  }, [])

  function set(k: string, v: string) {
    setValues((s) => ({ ...s, [k]: v }))
  }

  async function save() {
    setSaving(true)
    setMsg('')
    setDetail('')
    const keys = [
      'footer_col1_title',
      'footer_col1',
      'footer_col2_title',
      'footer_col2',
      'footer_col3_title',
      'footer_col3',
      'footer_social',
      'footer_copyright',
      'footer_html',
      'menu_footer',
    ]
    const payload: Record<string, string> = {}
    for (const k of keys) payload[k] = values[k] || ''

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: payload }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (res.ok) setMsg('Footer saved. Refresh any public page to see changes.')
    else {
      setMsg(data.error || 'Failed')
      setDetail(data.detail || '')
    }
  }

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Link href="/admin/settings" className="text-xs text-[#8b1a1a] hover:underline">
        ← Settings
      </Link>
      <h1 className="text-xl sm:text-2xl font-bold text-[#2d0808] mt-2 mb-1">Footer</h1>
      <p className="text-sm text-[#6b5555] mb-6">
        Edit footer columns, social links and copyright. Format each link as{' '}
        <code className="bg-slate-100 px-1 rounded text-xs">Label|/path</code> — one per line.
      </p>

      <div className="bg-white rounded-2xl border border-[#f0e0e0] p-5 space-y-4">
        <Field label="Column 1 title" value={values.footer_col1_title} onChange={(v) => set('footer_col1_title', v)} placeholder="Discover" />
        <Field
          label="Column 1 links"
          value={values.footer_col1}
          onChange={(v) => set('footer_col1', v)}
          multiline
          placeholder={'Ranking|/ranking\nTrending|/trending\nExplore|/explore'}
        />
        <Field label="Column 2 title" value={values.footer_col2_title} onChange={(v) => set('footer_col2_title', v)} placeholder="Tools" />
        <Field
          label="Column 2 links"
          value={values.footer_col2}
          onChange={(v) => set('footer_col2', v)}
          multiline
          placeholder={'Compare|/compare\nTags|/tag\nCollections|/collections'}
        />
        <Field label="Column 3 title" value={values.footer_col3_title} onChange={(v) => set('footer_col3_title', v)} placeholder="Account" />
        <Field
          label="Column 3 links"
          value={values.footer_col3}
          onChange={(v) => set('footer_col3', v)}
          multiline
          placeholder={'Add media|/submit\nSign up|/signup'}
        />
        <Field
          label="Social links"
          value={values.footer_social}
          onChange={(v) => set('footer_social', v)}
          multiline
          placeholder={'Twitter|https://x.com/...\nTelegram|https://t.me/...'}
        />
        <Field
          label="Copyright line"
          value={values.footer_copyright}
          onChange={(v) => set('footer_copyright', v)}
          placeholder="© 2026 My Directory"
        />
        <Field
          label="Extra HTML (optional)"
          value={values.footer_html}
          onChange={(v) => set('footer_html', v)}
          multiline
          placeholder="<p>Custom note…</p>"
        />

        {msg && (
          <p className={`text-sm ${msg.includes('saved') ? 'text-emerald-700' : 'text-red-600'}`}>
            {msg}
          </p>
        )}
        {detail && <pre className="text-[11px] bg-red-50 p-2 rounded">{detail}</pre>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-[#8b1a1a] to-[#4a0e0e] px-5 py-2.5 text-sm text-white font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save footer'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[#5c4040]">{label}</label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full mt-1 rounded-lg border border-[#e8d8d8] px-3 py-2 text-sm font-mono"
        />
      ) : (
        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full mt-1 rounded-lg border border-[#e8d8d8] px-3 py-2 text-sm"
        />
      )}
    </div>
  )
}
