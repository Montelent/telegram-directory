'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TinyMCEEditor from '@/components/TinyMCEEditor'

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
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const finalSlug = slug || slugify(title)
    const res = await fetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug: finalSlug,
        excerpt,
        content,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt,
        published,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to save')
      return
    }

    router.push('/admin/blog')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Link href="/admin/blog" className="text-sm text-blue-600 hover:underline">
        ← Blog
      </Link>
      <h1 className="text-xl font-bold mt-2 mb-6">New post</h1>

      <form onSubmit={save} className="space-y-4">
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
        <div>
          <label className="text-sm font-medium">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono"
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
          <label className="text-sm font-medium mb-1 block">Content (TinyMCE)</label>
          <TinyMCEEditor value={content} onChange={setContent} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">SEO title</label>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              placeholder="Defaults to title"
            />
          </div>
          <div>
            <label className="text-sm font-medium">SEO description</label>
            <input
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              placeholder="Defaults to excerpt"
            />
          </div>
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
      </form>
    </div>
  )
}
