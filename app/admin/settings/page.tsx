'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SectionId = 'general' | 'seo' | 'homepage' | 'menu' | 'colors' | 'submissions'

const SECTIONS: { id: SectionId; label: string; desc: string }[] = [
  { id: 'general', label: 'Logo & site identity', desc: 'Name, tagline, logo URL' },
  { id: 'seo', label: 'SEO (RankMath-style)', desc: 'Defaults + channel JSON-LD' },
  { id: 'homepage', label: 'Homepage', desc: 'Hero text, sections visibility' },
  { id: 'menu', label: 'Menu', desc: 'Header navigation labels & links' },
  { id: 'colors', label: 'Colors', desc: 'Primary brand color' },
  { id: 'submissions', label: 'Submissions & feature', desc: 'Rules text, feature price' },
]

export default function AdminSettingsPage() {
  const [section, setSection] = useState<SectionId>('general')
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

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: values }),
    })
    setSaving(false)
    setMsg(res.ok ? 'Settings saved.' : 'Failed. Ensure site_settings table exists.')
  }

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-slate-500 mb-6">
        Site-wide configuration.{' '}
        <Link href="/admin/ads" className="text-[#8b1a1a] hover:underline">Ads</Link>
        {' · '}
        <Link href="/admin/scripts" className="text-[#8b1a1a] hover:underline">Scripts</Link>
        {' · '}
        <Link href="/admin/payments" className="text-[#8b1a1a] hover:underline">Payments</Link>
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 shrink-0 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition ${
                section === s.id
                  ? 'bg-[#f8e8e8] text-[#8b1a1a] font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="block">{s.label}</span>
              <span className="block text-xs opacity-70 font-normal">{s.desc}</span>
            </button>
          ))}
        </nav>

        <div className="flex-1 max-w-2xl bg-white rounded-xl border p-5 sm:p-6 space-y-4">
          {section === 'general' && (
            <>
              <h2 className="font-semibold">Logo & site identity</h2>
              <Field label="Site name" value={values.site_name} onChange={(v) => set('site_name', v)} />
              <Field label="Tagline" value={values.site_tagline} onChange={(v) => set('site_tagline', v)} />
              <Field label="Logo URL" value={values.logo_url} onChange={(v) => set('logo_url', v)} placeholder="https://…/logo.png" />
              <Field label="Favicon URL" value={values.favicon_url} onChange={(v) => set('favicon_url', v)} />
            </>
          )}

          {section === 'seo' && (
            <>
              <h2 className="font-semibold">SEO</h2>
              <Field label="Default SEO title" value={values.default_seo_title} onChange={(v) => set('default_seo_title', v)} />
              <Field label="Default meta description" value={values.default_seo_description} onChange={(v) => set('default_seo_description', v)} multiline />
              <Field label="Title template for channels" value={values.seo_entity_title_template} onChange={(v) => set('seo_entity_title_template', v)} placeholder="{title} – Telegram {type}" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={values.seo_jsonld_entities !== '0'} onChange={(e) => set('seo_jsonld_entities', e.target.checked ? '1' : '0')} />
                Auto JSON-LD on entity pages
              </label>
            </>
          )}

          {section === 'homepage' && (
            <>
              <h2 className="font-semibold">Homepage</h2>
              <Field label="Hero headline" value={values.home_hero_title} onChange={(v) => set('home_hero_title', v)} />
              <Field label="Hero subtitle" value={values.home_hero_subtitle} onChange={(v) => set('home_hero_subtitle', v)} multiline />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={values.home_show_categories !== '0'} onChange={(e) => set('home_show_categories', e.target.checked ? '1' : '0')} />
                Show categories grid
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={values.home_show_blog === '1'} onChange={(e) => set('home_show_blog', e.target.checked ? '1' : '0')} />
                Show latest blog posts
              </label>
            </>
          )}

          {section === 'menu' && (
            <>
              <h2 className="font-semibold">Menu</h2>
              <Field label="Header menu (Label|/path)" value={values.menu_header} onChange={(v) => set('menu_header', v)} multiline placeholder="Search|/search, Blog|/blog" />
              <Field label="Footer menu" value={values.menu_footer} onChange={(v) => set('menu_footer', v)} multiline />
            </>
          )}

          {section === 'colors' && (
            <>
              <h2 className="font-semibold">Colors</h2>
              <Field label="Primary (hex)" value={values.color_primary || '#4a0e0e'} onChange={(v) => set('color_primary', v)} />
              <Field label="Accent (hex)" value={values.color_accent || '#c41e3a'} onChange={(v) => set('color_accent', v)} />
            </>
          )}

          {section === 'submissions' && (
            <>
              <h2 className="font-semibold">Submissions & feature pricing</h2>
              <Field
                label="Feature price (USD)"
                value={values.feature_price || '20'}
                onChange={(v) => set('feature_price', v)}
                placeholder="20"
              />
              <Field
                label="Submission rules (shown on Add media)"
                value={values.submission_rules}
                onChange={(v) => set('submission_rules', v)}
                multiline
                placeholder="Only public channels…"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={values.feature_enabled !== '0'}
                  onChange={(e) => set('feature_enabled', e.target.checked ? '1' : '0')}
                />
                Allow paid feature on submit
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={values.nsfw_enabled !== '0'}
                  onChange={(e) => set('nsfw_enabled', e.target.checked ? '1' : '0')}
                />
                Allow NSFW flag on submit
              </label>
            </>
          )}

          {msg && <p className="text-sm text-slate-600">{msg}</p>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-gradient-to-r from-[#8b1a1a] to-[#4a0e0e] px-5 py-2.5 text-sm text-white font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save this section'}
          </button>
        </div>
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
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
        />
      ) : (
        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
        />
      )}
    </div>
  )
}
