'use client'

import { useEffect, useState } from 'react'
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

export default function NewBlogPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [seo, setSeo] = useState<SeoData>(defaultSeoData)
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSeoMobile, setShowSeoMobile] = useState(false)

  useEffect(() => {
    fetch('/api/admin/blog/categories')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCategories(d)
      })
      .catch(() => {})
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const finalSlug = slug || slugify(title)
    const seoJsonLd =
      seo.jsonLdOverride ??
      buildJsonLd({
        data: seo,
        title,
        slug: finalSlug,
        excerpt,
        siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
        siteName: 'Site',
        publishedAt: published ? new Date().toISOString() : null,
        coverImage,
      })

    const res = await fetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug: finalSlug,
        excerpt,
        content,
        coverImage: coverImage || null,
        categoryId: categoryId || null,
        seoTitle: seo.seoTitle || title,
        seoDescription: seo.seoDescription || excerpt,
        seoJsonLd,
        focusKeyword: seo.focusKeyword,
        canonicalUrl: seo.canonical || null,
        robots: seo.robots,
        published,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to save')
      return
    }
    router.push('/admin/blog')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/admin/blog" className="text-sm text-blue-600 hover:underline">
        ← Blog
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="text-xl font-bold">New post</h1>
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
                setTitle(e.target.value)
                if (!slug) setSlug(slugify(e.target.value))
              }}
              required
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Link href="/admin/blog/categories" className="text-xs text-blue-600 hover:underline">
                Manage categories
              </Link>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Cover image URL</label>
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://…"
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
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
            Publish now
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save post'}
          </button>
        </div>

        {/* SEO panel: inline on large screens */}
        <div className="hidden lg:block">
          <BlogSeoPanel
            title={title}
            slug={slug}
            excerpt={excerpt}
            coverImage={coverImage}
            data={seo}
            onChange={setSeo}
          />
        </div>
      </form>

      {/* SEO panel: slide-over on small/medium screens */}
      {showSeoMobile && (
        <div className="lg:hidden fixed inset-0 z-[70] flex justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowSeoMobile(false)} />
          <div className="relative w-full sm:w-[420px] max-w-full bg-[#faf4f4] h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
              <span className="font-semibold text-sm">SEO settings</span>
              <button onClick={() => setShowSeoMobile(false)} className="p-1.5" aria-label="Close">✕</button>
            </div>
            <div className="p-3">
              <BlogSeoPanel
                title={title}
                slug={slug}
                excerpt={excerpt}
                coverImage={coverImage}
                data={seo}
                onChange={setSeo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
