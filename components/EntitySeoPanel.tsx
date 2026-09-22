'use client'

import { useEffect, useMemo, useState } from 'react'

type SchemaType = 'Organization' | 'WebPage' | 'Product' | 'LocalBusiness'

export interface EntitySeoData {
  seoTitle: string
  seoDescription: string
  focusKeyword: string
  canonical: string
  robots: string
  schemaType: SchemaType
  ogImage: string
  breadcrumbsEnabled: boolean
  jsonLdOverride: string | null
}

export const defaultEntitySeoData: EntitySeoData = {
  seoTitle: '',
  seoDescription: '',
  focusKeyword: '',
  canonical: '',
  robots: 'index,follow',
  schemaType: 'Organization',
  ogImage: '',
  breadcrumbsEnabled: true,
  jsonLdOverride: null,
}

export function buildEntityJsonLd(opts: {
  data: EntitySeoData
  title: string
  entityId: string
  username?: string | null
  description?: string | null
  photoUrl?: string | null
  memberCount?: number | null
  categoryName?: string | null
  categorySlug?: string | null
  siteUrl: string
  siteName: string
}) {
  const {
    data,
    title,
    entityId,
    username,
    description,
    photoUrl,
    memberCount,
    categoryName,
    categorySlug,
    siteUrl,
    siteName,
  } = opts

  const headline = data.seoTitle || title
  const desc = data.seoDescription || description || ''
  const url = data.canonical || `${siteUrl}/entity/${entityId}`
  const image = data.ogImage || photoUrl || undefined

  const graph: any[] = []

  const mainEntity: any = {
    '@type': data.schemaType,
    name: title,
    url,
    description: desc || undefined,
    image: image ? [image] : undefined,
    sameAs: username ? [`https://t.me/${username}`] : undefined,
  }

  if (data.schemaType === 'Product') {
    mainEntity.aggregateRating =
      memberCount != null
        ? undefined // ratings are handled by ReviewSection separately; avoid inventing data
        : undefined
    mainEntity.brand = { '@type': 'Brand', name: siteName }
  }

  if (data.schemaType === 'LocalBusiness') {
    mainEntity['@type'] = 'LocalBusiness'
  }

  graph.push(mainEntity)

  if (data.breadcrumbsEnabled) {
    const items = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
    ]
    if (categoryName && categorySlug) {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: categoryName,
        item: `${siteUrl}/category/${categorySlug}`,
      })
      items.push({ '@type': 'ListItem', position: 3, name: title, item: url })
    } else {
      items.push({ '@type': 'ListItem', position: 2, name: title, item: url })
    }
    graph.push({ '@type': 'BreadcrumbList', itemListElement: items })
  }

  const doc = { '@context': 'https://schema.org', '@graph': graph }
  return JSON.stringify(doc, (_k, v) => (v === undefined ? undefined : v), 2)
}

export default function EntitySeoPanel({
  title,
  entityId,
  username,
  description,
  photoUrl,
  memberCount,
  categoryName,
  categorySlug,
  siteUrl = 'https://yoursite.com',
  siteName = 'Your Site',
  data,
  onChange,
}: {
  title: string
  entityId: string
  username?: string | null
  description?: string | null
  photoUrl?: string | null
  memberCount?: number | null
  categoryName?: string | null
  categorySlug?: string | null
  siteUrl?: string
  siteName?: string
  data: EntitySeoData
  onChange: (data: EntitySeoData) => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [jsonLdDraft, setJsonLdDraft] = useState('')
  const [jsonLdError, setJsonLdError] = useState('')

  function set<K extends keyof EntitySeoData>(key: K, value: EntitySeoData[K]) {
    onChange({ ...data, [key]: value })
  }

  const autoJsonLd = useMemo(
    () =>
      buildEntityJsonLd({
        data,
        title,
        entityId,
        username,
        description,
        photoUrl,
        memberCount,
        categoryName,
        categorySlug,
        siteUrl,
        siteName,
      }),
    [data, title, entityId, username, description, photoUrl, memberCount, categoryName, categorySlug, siteUrl, siteName]
  )

  const effectiveJsonLd = data.jsonLdOverride ?? autoJsonLd

  useEffect(() => {
    if (showAdvanced) setJsonLdDraft(effectiveJsonLd)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdvanced])

  function applyJsonLdEdit() {
    try {
      JSON.parse(jsonLdDraft)
      setJsonLdError('')
      set('jsonLdOverride', jsonLdDraft)
    } catch {
      setJsonLdError('Invalid JSON — fix the syntax before applying.')
    }
  }

  function resetJsonLdToAuto() {
    set('jsonLdOverride', null)
    setJsonLdDraft(autoJsonLd)
    setJsonLdError('')
  }

  const previewTitle = (data.seoTitle || title || 'Entity title').slice(0, 70)
  const previewDesc = (data.seoDescription || 'Meta description will appear here.').slice(0, 165)
  const titleLen = (data.seoTitle || title).length
  const descLen = data.seoDescription.length
  const kw = data.focusKeyword.trim().toLowerCase()

  const checks = useMemo(() => {
    const list: { pass: boolean; label: string }[] = []
    list.push({ pass: titleLen >= 30 && titleLen <= 60, label: 'SEO title is 30–60 characters' })
    list.push({ pass: descLen >= 120 && descLen <= 160, label: 'Meta description is 120–160 characters' })
    if (kw) {
      list.push({
        pass: (data.seoTitle || title).toLowerCase().includes(kw),
        label: 'Focus keyword appears in the SEO title',
      })
      list.push({
        pass: data.seoDescription.toLowerCase().includes(kw),
        label: 'Focus keyword appears in the meta description',
      })
    } else {
      list.push({ pass: false, label: 'Set a focus keyword to unlock keyword checks' })
    }
    list.push({ pass: !!data.ogImage || !!photoUrl, label: 'Social share image is set' })
    return list
  }, [titleLen, descLen, kw, data, title, photoUrl])

  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100)
  const scoreColor =
    score >= 80 ? 'text-green-600 bg-green-50' : score >= 50 ? 'text-yellow-700 bg-yellow-50' : 'text-red-600 bg-red-50'

  return (
    <div className="bg-white rounded-xl border sticky top-4">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">SEO & Schema</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${scoreColor}`}>{score}/100</span>
      </div>

      <div className="p-4 space-y-5 max-h-[75vh] overflow-y-auto">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Google preview
          </p>
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="text-blue-700 text-base leading-snug truncate">{previewTitle}</p>
            <p className="text-green-700 text-xs truncate">
              {siteUrl.replace(/^https?:\/\//, '')}/entity/{entityId}
            </p>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{previewDesc}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Social preview
          </p>
          <div className="rounded-lg border overflow-hidden">
            <div className="aspect-[1.91/1] bg-slate-100 flex items-center justify-center overflow-hidden">
              {data.ogImage || photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.ogImage || photoUrl || ''} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">No image set</span>
              )}
            </div>
            <div className="p-2 bg-white">
              <p className="text-[11px] text-slate-400 uppercase truncate">
                {siteUrl.replace(/^https?:\/\//, '')}
              </p>
              <p className="text-sm font-medium truncate">{previewTitle}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Checklist
          </p>
          <ul className="space-y-1.5">
            {checks.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className={c.pass ? 'text-green-600' : 'text-slate-300'}>{c.pass ? '✓' : '○'}</span>
                <span className={c.pass ? 'text-slate-600' : 'text-slate-400'}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Focus keyword</label>
            <input
              value={data.focusKeyword}
              onChange={(e) => set('focusKeyword', e.target.value)}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              placeholder="e.g. crypto signals channel"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs">
              <label className="font-medium text-slate-600">SEO title</label>
              <span className={titleLen > 60 ? 'text-red-500' : 'text-slate-400'}>{titleLen}/60</span>
            </div>
            <input
              value={data.seoTitle}
              onChange={(e) => set('seoTitle', e.target.value)}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              placeholder="Defaults to entity title"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs">
              <label className="font-medium text-slate-600">Meta description</label>
              <span className={descLen > 160 ? 'text-red-500' : 'text-slate-400'}>{descLen}/160</span>
            </div>
            <textarea
              value={data.seoDescription}
              onChange={(e) => set('seoDescription', e.target.value)}
              rows={3}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              placeholder="Compelling summary for search results"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Social share image URL</label>
            <input
              value={data.ogImage}
              onChange={(e) => set('ogImage', e.target.value)}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              placeholder="https://… (falls back to photo)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Canonical URL</label>
              <input
                value={data.canonical}
                onChange={(e) => set('canonical', e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                placeholder="https://…"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Robots</label>
              <select
                value={data.robots}
                onChange={(e) => set('robots', e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              >
                <option value="index,follow">index, follow</option>
                <option value="noindex,follow">noindex, follow</option>
                <option value="index,nofollow">index, nofollow</option>
                <option value="noindex,nofollow">noindex, nofollow</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Schema (JSON-LD)
          </p>

          <div>
            <label className="text-xs font-medium text-slate-600">Schema type</label>
            <select
              value={data.schemaType}
              onChange={(e) => set('schemaType', e.target.value as SchemaType)}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            >
              <option value="Organization">Organization</option>
              <option value="WebPage">Web Page</option>
              <option value="Product">Product</option>
              <option value="LocalBusiness">Local Business</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.breadcrumbsEnabled}
              onChange={(e) => set('breadcrumbsEnabled', e.target.checked)}
            />
            Include breadcrumb schema
          </label>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-medium text-blue-600 flex items-center gap-1"
          >
            {showAdvanced ? '▾' : '▸'} Advanced: edit JSON-LD manually
          </button>

          {showAdvanced && (
            <div className="space-y-2">
              <textarea
                value={jsonLdDraft}
                onChange={(e) => setJsonLdDraft(e.target.value)}
                rows={10}
                className="w-full rounded-lg border px-3 py-2 text-[11px] font-mono bg-slate-900 text-slate-100"
                spellCheck={false}
              />
              {jsonLdError && <p className="text-xs text-red-600">{jsonLdError}</p>}
              {data.jsonLdOverride && (
                <p className="text-[11px] text-amber-600">
                  Manual override active — auto-generated fields above are ignored on save.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyJsonLdEdit}
                  className="text-xs rounded-lg bg-slate-800 text-white px-3 py-1.5 font-medium"
                >
                  Apply override
                </button>
                <button
                  type="button"
                  onClick={resetJsonLdToAuto}
                  className="text-xs rounded-lg border px-3 py-1.5 font-medium"
                >
                  Reset to auto-generated
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
