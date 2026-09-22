'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type LinkRow = { label: string; href: string }

function parseLines(raw?: string): LinkRow[] {
  if (!raw?.trim()) return []
  return raw
    .split(/\n|,/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split('|').map((s) => s.trim())
      return { label: label || '', href: href || '' }
    })
}

function serializeLines(rows: LinkRow[]): string {
  return rows
    .filter((r) => r.label.trim() || r.href.trim())
    .map((r) => `${r.label}|${r.href}`)
    .join('\n')
}

export default function AdminFooterPage() {
  const [colTitles, setColTitles] = useState({ col1: '', col2: '', col3: '' })
  const [cols, setCols] = useState<{ col1: LinkRow[]; col2: LinkRow[]; col3: LinkRow[] }>({
    col1: [],
    col2: [],
    col3: [],
  })
  const [social, setSocial] = useState<LinkRow[]>([])
  const [copyright, setCopyright] = useState('')
  const [footerHtml, setFooterHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || {}
        setColTitles({
          col1: s.footer_col1_title || 'Discover',
          col2: s.footer_col2_title || 'Tools',
          col3: s.footer_col3_title || 'Account',
        })
        setCols({
          col1: parseLines(s.footer_col1 || s.menu_footer),
          col2: parseLines(s.footer_col2),
          col3: parseLines(s.footer_col3),
        })
        setSocial(parseLines(s.footer_social))
        setCopyright(s.footer_copyright || '')
        setFooterHtml(s.footer_html || '')
      })
      .finally(() => setLoading(false))
  }, [])

  function updateRow(col: 'col1' | 'col2' | 'col3', idx: number, field: keyof LinkRow, value: string) {
    setCols((c) => {
      const next = [...c[col]]
      next[idx] = { ...next[idx], [field]: value }
      return { ...c, [col]: next }
    })
  }

  function addRow(col: 'col1' | 'col2' | 'col3') {
    setCols((c) => ({ ...c, [col]: [...c[col], { label: '', href: '' }] }))
  }

  function removeRow(col: 'col1' | 'col2' | 'col3', idx: number) {
    setCols((c) => ({ ...c, [col]: c[col].filter((_, i) => i !== idx) }))
  }

  function moveRow(col: 'col1' | 'col2' | 'col3', idx: number, dir: -1 | 1) {
    setCols((c) => {
      const next = [...c[col]]
      const target = idx + dir
      if (target < 0 || target >= next.length) return c
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return { ...c, [col]: next }
    })
  }

  function updateSocial(idx: number, field: keyof LinkRow, value: string) {
    setSocial((s) => {
      const next = [...s]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  async function save() {
    setSaving(true)
    setMsg('')
    setDetail('')
    const payload: Record<string, string> = {
      footer_col1_title: colTitles.col1,
      footer_col2_title: colTitles.col2,
      footer_col3_title: colTitles.col3,
      footer_col1: serializeLines(cols.col1),
      footer_col2: serializeLines(cols.col2),
      footer_col3: serializeLines(cols.col3),
      footer_social: serializeLines(social),
      footer_copyright: copyright,
      footer_html: footerHtml,
      menu_footer: serializeLines(cols.col1),
    }

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <Link href="/admin/settings" className="text-xs text-[#8b1a1a] hover:underline">
        ← Settings
      </Link>
      <h1 className="text-xl sm:text-2xl font-bold text-[#2d0808] mt-2 mb-1">Footer menu</h1>
      <p className="text-sm text-[#6b5555] mb-6">
        Build the three footer columns, social links, and copyright shown on every public page.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        {(['col1', 'col2', 'col3'] as const).map((col) => (
          <div key={col} className="bg-white rounded-2xl border border-[#f0e0e0] p-4">
            <input
              value={colTitles[col]}
              onChange={(e) => setColTitles((t) => ({ ...t, [col]: e.target.value }))}
              placeholder="Column title"
              className="w-full font-semibold text-sm text-[#2d0808] border-b border-[#f0e0e0] pb-2 mb-3 focus:outline-none focus:border-[#8b1a1a]"
            />
            <div className="space-y-2">
              {cols[col].map((row, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <div className="flex-1 space-y-1">
                    <input
                      value={row.label}
                      onChange={(e) => updateRow(col, idx, 'label', e.target.value)}
                      placeholder="Label"
                      className="w-full rounded-md border border-[#e8d8d8] px-2 py-1.5 text-xs"
                    />
                    <input
                      value={row.href}
                      onChange={(e) => updateRow(col, idx, 'href', e.target.value)}
                      placeholder="/path"
                      className="w-full rounded-md border border-[#e8d8d8] px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => moveRow(col, idx, -1)}
                      disabled={idx === 0}
                      className="w-6 h-6 rounded text-[#8b1a1a] hover:bg-[#f8e8e8] disabled:opacity-20 text-xs"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(col, idx, 1)}
                      disabled={idx === cols[col].length - 1}
                      className="w-6 h-6 rounded text-[#8b1a1a] hover:bg-[#f8e8e8] disabled:opacity-20 text-xs"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRow(col, idx)}
                      className="w-6 h-6 rounded text-red-600 hover:bg-red-50 text-xs"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addRow(col)}
              className="mt-3 w-full rounded-lg border border-dashed border-[#e8d8d8] py-1.5 text-xs text-[#8b1a1a] hover:bg-[#faf4f4]"
            >
              + Add link
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#f0e0e0] p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-[#5c4040] mb-2">Social links</p>
          <div className="space-y-2">
            {social.map((row, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={row.label}
                  onChange={(e) => updateSocial(idx, 'label', e.target.value)}
                  placeholder="Twitter"
                  className="w-32 rounded-md border border-[#e8d8d8] px-2 py-1.5 text-xs"
                />
                <input
                  value={row.href}
                  onChange={(e) => updateSocial(idx, 'href', e.target.value)}
                  placeholder="https://x.com/..."
                  className="flex-1 rounded-md border border-[#e8d8d8] px-2 py-1.5 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setSocial((s) => s.filter((_, i) => i !== idx))}
                  className="w-8 rounded text-red-600 hover:bg-red-50 text-xs"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSocial((s) => [...s, { label: '', href: '' }])}
            className="mt-2 rounded-lg border border-dashed border-[#e8d8d8] px-3 py-1.5 text-xs text-[#8b1a1a] hover:bg-[#faf4f4]"
          >
            + Add social link
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-[#5c4040]">Copyright line</label>
          <input
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
            placeholder="© 2026 My Directory"
            className="w-full mt-1 rounded-lg border border-[#e8d8d8] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[#5c4040]">Extra HTML (optional)</label>
          <textarea
            value={footerHtml}
            onChange={(e) => setFooterHtml(e.target.value)}
            placeholder="<p>Custom note…</p>"
            rows={3}
            className="w-full mt-1 rounded-lg border border-[#e8d8d8] px-3 py-2 text-sm font-mono"
          />
        </div>

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
