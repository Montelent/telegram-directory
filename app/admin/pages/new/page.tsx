'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TinyMCEEditor from '@/components/TinyMCEEditor'
import BlogSeoPanel, { defaultSeoData, buildJsonLd, SeoData } from '@/components/BlogSeoPanel'

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

export default function NewPageAdminPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [content, setContent] = useState('')
  const [seo, setSeo] = useState<SeoData>({
    ...defaultSeoData,
    schemaType: 'WebPage',
  })
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSeoMobile, setShowSeoMobile] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const finalSlug = slug || slugify(title)
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const seoJsonLd =
      seo.jsonLdOverride ??
      buildJsonLd({
        data: seo,
        title,
        slug: finalSlug,
        excerpt: seo.seoDescription || '',
        siteUrl,
        siteName: 'Telegram Directory',
        publishedAt: published ? new Date().toISOString() : null,
        coverImage: seo.ogImage,
        pathPrefix: '/p',
      })

    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug: finalSlug,
        content,
        published,
        seoTitle: seo.seoTitle || title,
        seoDescription: seo.seoDescription || null,
        seoJsonLd,
        focusKeyword: seo.focusKeyword,
        canonicalUrl: seo.canonical || null,
        robots: seo.robots,
        ogImage: seo.ogImage || null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to save')
      return
    }
    router.push(`/admin/pages/${data.id}`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/admin/pages" className="text-sm text-blue-600 hover:underline">
        ← Pages
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="text-xl font-bold">New page</h1>
        <button
          type="button"
          onClick={() => setShowSeoMobile(true)}
          className="lg:hidden rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          SEO settings
        </button>
      </div>

      <form onSubmit={save} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => {
                const v = e.target.value
                setTitle(v)
                if (!slugTouched) setSlug(slugify(v))
              }}
              required
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Slug</label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-slate-400">/p/</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                required
                pattern="[a-z0-9-]+"
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Auto from title — edit anytime</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Content</label>
            <TinyMCEEditor value={content} onChange={setContent} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publish immediately
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Create page'}
          </button>
        </div>

        <div className="hidden lg:block">
          <BlogSeoPanel
            data={seo}
            onChange={setSeo}
            title={title}
            slug={slug}
            excerpt={seo.seoDescription}
            coverImage={seo.ogImage}
            pathPrefix="/p"
          />
        </div>
      </form>

      {showSeoMobile && (
        <div className="lg:hidden fixed inset-0 z-[70] flex justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowSeoMobile(false)} />
          <div className="relative w-full sm:w-[420px] max-w-full bg-[#faf4f4] h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
              <span className="font-semibold text-sm">SEO settings</span>
              <button onClick={() => setShowSeoMobile(false)} className="p-1.5" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="p-3">
              <BlogSeoPanel
                data={seo}
                onChange={setSeo}
                title={title}
                slug={slug}
                excerpt={seo.seoDescription}
                coverImage={seo.ogImage}
                pathPrefix="/p"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
