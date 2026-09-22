'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SectionId = 'general' | 'seo' | 'homepage' | 'stats' | 'menu' | 'colors' | 'submissions'

const SECTIONS: { id: SectionId; label: string; desc: string }[] = [
  { id: 'general', label: 'Logo & site identity', desc: 'Name, tagline, logo URL' },
  { id: 'seo', label: 'SEO', desc: 'Meta, social cards, robots' },
  { id: 'homepage', label: 'Homepage', desc: 'Hero and Why section text' },
  { id: 'stats', label: 'Homepage counters', desc: 'Real or fake views / users / media' },
  { id: 'menu', label: 'Menu', desc: 'Header navigation labels & links' },
  { id: 'colors', label: 'Colors', desc: 'Live brand color theme' },
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
        <Link href="/admin/ads" className="text-[#8b1a1a] hover:underline">
          Ads
        </Link>
        {' · '}
        <Link href="/admin/scripts" className="text-[#8b1a1a] hover:underline">
          Scripts
        </Link>
        {' · '}
        <Link href="/admin/footer" className="text-[#8b1a1a] hover:underline">
          Footer
        </Link>
        {' · '}
        <Link href="/admin/payments" className="text-[#8b1a1a] hover:underline">
          Payments
        </Link>
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 shrink-0 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={
                'w-full text-left rounded-lg px-3 py-2.5 text-sm transition ' +
                (section === s.id
                  ? 'bg-[#f8e8e8] text-[#8b1a1a] font-medium'
                  : 'text-slate-600 hover:bg-slate-100')
              }
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
              <Field
                label="Logo URL"
                value={values.logo_url}
                onChange={(v) => set('logo_url', v)}
                placeholder="https://…/logo.png"
              />
              <Field
                label="Favicon URL"
                value={values.favicon_url}
                onChange={(v) => set('favicon_url', v)}
              />
            </>
          )}

          {section === 'seo' && (
            <>
              <h2 className="font-semibold">SEO</h2>
              <Field
                label="Default SEO title"
                value={values.default_seo_title}
                onChange={(v) => set('default_seo_title', v)}
              />
              <Field
                label="Default meta description"
                value={values.default_seo_description}
                onChange={(v) => set('default_seo_description', v)}
                multiline
              />
              <Field
                label="Default OG / social image URL"
                value={values.seo_og_image}
                onChange={(v) => set('seo_og_image', v)}
                placeholder="https://…/og-image.png (1200×630)"
              />
              <div>
                <label className="text-sm font-medium text-slate-700">Twitter card type</label>
                <select
                  value={values.seo_twitter_card || 'summary_large_image'}
                  onChange={(e) => set('seo_twitter_card', e.target.value)}
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="summary_large_image">Summary with large image</option>
                  <option value="summary">Summary</option>
                </select>
              </div>
              <Field
                label="Canonical base URL"
                value={values.seo_canonical_base}
                onChange={(v) => set('seo_canonical_base', v)}
                placeholder="https://yourdomain.com"
              />
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.seo_jsonld_entities !== '0'}
                    onChange={(e) => set('seo_jsonld_entities', e.target.checked ? '1' : '0')}
                  />
                  Auto JSON-LD on entity pages
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.seo_noindex === '1'}
                    onChange={(e) => set('seo_noindex', e.target.checked ? '1' : '0')}
                  />
                  Block search engines (robots: noindex) — for staging only
                </label>
              </div>
            </>
          )}

          {section === 'homepage' && (
            <>
              <h2 className="font-semibold">Homepage</h2>
              <Field
                label="Hero headline"
                value={values.home_hero_title}
                onChange={(v) => set('home_hero_title', v)}
              />
              <Field
                label="Hero subtitle"
                value={values.home_hero_subtitle}
                onChange={(v) => set('home_hero_subtitle', v)}
                multiline
              />
              <Field
                label='Why section title'
                value={values.home_why_title}
                onChange={(v) => set('home_why_title', v)}
                placeholder="Why Add Your Channel or Bot to Our Directory?"
              />
              <Field
                label="Why section subtitle"
                value={values.home_why_subtitle}
                onChange={(v) => set('home_why_subtitle', v)}
                multiline
              />
            </>
          )}

          {section === 'stats' && (
            <>
              <h2 className="font-semibold">Homepage counters</h2>
              <p className="text-xs text-slate-500">
                When "Use display values below" is on, the homepage shows your custom numbers
                (e.g. 1M+, 277K). When off, users and listed media use real database counts; views
                show as — until you enable display values.
              </p>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={values.stats_use_fake === '1'}
                  onChange={(e) => set('stats_use_fake', e.target.checked ? '1' : '0')}
                />
                Use display values below (override real counts)
              </label>
              <Field
                label="Views display (e.g. 1M+)"
                value={values.stats_views_display}
                onChange={(v) => set('stats_views_display', v)}
                placeholder="1M+"
              />
              <Field
                label="Views label"
                value={values.stats_views_label}
                onChange={(v) => set('stats_views_label', v)}
                placeholder="Views per Month (250K+ visitors/month)"
              />
              <Field
                label="Users display (e.g. 277K)"
                value={values.stats_users_display}
                onChange={(v) => set('stats_users_display', v)}
                placeholder="277K"
              />
              <Field
                label="Users label"
                value={values.stats_users_label}
                onChange={(v) => set('stats_users_label', v)}
                placeholder="Registered Users (+860 this month)"
              />
              <Field
                label="Listed media display (e.g. 37,710)"
                value={values.stats_media_display}
                onChange={(v) => set('stats_media_display', v)}
                placeholder="37,710"
              />
              <Field
                label="Media label"
                value={values.stats_media_label}
                onChange={(v) => set('stats_media_label', v)}
                placeholder="Listed Media (+342 this month)"
              />
            </>
          )}

          {section === 'menu' && (
            <>
              <h2 className="font-semibold">Menu</h2>
              <Field
                label="Header menu (Label|/path)"
                value={values.menu_header}
                onChange={(v) => set('menu_header', v)}
                multiline
                placeholder="Search|/search, Blog|/blog"
              />
              <p className="text-xs text-slate-500 -mt-2">
                For the footer menu builder (columns, social links, reordering), use{' '}
                <Link href="/admin/footer" className="text-[#8b1a1a] hover:underline">
                  Footer settings
                </Link>
                .
              </p>
            </>
          )}

          {section === 'colors' && (
            <>
              <h2 className="font-semibold">Colors</h2>
              <p className="text-xs text-slate-500 -mt-2">
                Changes here update the live site's color theme immediately on save — no redeploy
                needed. Accent shades (pale/wash/soft) are derived automatically.
              </p>
              <ColorField
                label="Primary brand color"
                value={values.color_primary || '#4a0e0e'}
                onChange={(v) => set('color_primary', v)}
              />
              <ColorField
                label="Accent color"
                value={values.color_accent || '#c41e3a'}
                onChange={(v) => set('color_accent', v)}
              />
              <ThemePreview
                primary={values.color_primary || '#4a0e0e'}
                accent={values.color_accent || '#c41e3a'}
              />
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
                label="Submission rules"
                value={values.submission_rules}
                onChange={(v) => set('submission_rules', v)}
                multiline
              />
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

function isValidHex(v: string) {
  return /^#[0-9a-f]{6}$/i.test(v)
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const valid = isValidHex(value)
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-3 mt-1">
        <input
          type="color"
          value={valid ? value : '#4a0e0e'}
          onChange={(e) => onChange(e.target.value)}
          className="w-11 h-11 rounded-lg border cursor-pointer p-0.5 shrink-0"
          aria-label={`${label} picker`}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#4a0e0e"
          maxLength={7}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-mono ${
            !valid && value ? 'border-red-300 text-red-600' : ''
          }`}
        />
      </div>
      {!valid && value && (
        <p className="text-xs text-red-500 mt-1">Use a 6-digit hex color, e.g. #4a0e0e</p>
      )}
    </div>
  )
}

function ThemePreview({ primary, accent }: { primary: string; accent: string }) {
  const validPrimary = isValidHex(primary) ? primary : '#4a0e0e'
  const validAccent = isValidHex(accent) ? accent : '#c41e3a'
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">Preview</p>
      <div
        className="rounded-xl p-4 flex items-center justify-between gap-3"
        style={{ background: `linear-gradient(135deg, ${validAccent} 0%, ${validPrimary} 100%)` }}
      >
        <div>
          <p className="text-white font-semibold text-sm">Your site header / buttons</p>
          <p className="text-white/80 text-xs">This gradient is used across CTAs</p>
        </div>
        <span
          className="rounded-lg bg-white/15 text-white text-xs font-medium px-3 py-1.5 border border-white/30"
        >
          Add media
        </span>
      </div>
    </div>
  )
}
