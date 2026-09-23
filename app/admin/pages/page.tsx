'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PageRow {
  id: string
  title: string
  slug: string
  published: boolean
  updatedAt: string
}

export default function AdminPagesListPage() {
  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/pages')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load')
        setPages([])
      } else {
        setPages(Array.isArray(data) ? data : [])
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(id: string) {
    if (!confirm('Delete this page?')) return
    await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Pages</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Custom pages with TinyMCE content and full SEO controls
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium shrink-0"
        >
          New page
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
          No pages yet.{' '}
          <Link href="/admin/pages/new" className="text-blue-600 hover:underline">
            Create one
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {pages.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{p.title}</p>
                <p className="text-xs text-slate-400">
                  /p/{p.slug} · {p.published ? 'Published' : 'Draft'} ·{' '}
                  {new Date(p.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3 text-xs shrink-0">
                {p.published && (
                  <Link
                    href={`/p/${p.slug}`}
                    target="_blank"
                    className="text-slate-500 hover:underline"
                  >
                    View
                  </Link>
                )}
                <Link href={`/admin/pages/${p.id}`} className="text-blue-600 hover:underline">
                  Edit
                </Link>
                <button onClick={() => remove(p.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
