'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  slug: string
  published: boolean
  publishedAt: string | null
  category: { name: string } | null
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog')
      if (res.ok) setPosts(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(id: string) {
    if (!confirm('Delete this post?')) return
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Blog</h1>
        <Link
          href="/admin/blog/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium"
        >
          New post
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
          No posts yet.{' '}
          <Link href="/admin/blog/new" className="text-blue-600 hover:underline">
            Write one
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {posts.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">{p.title}</p>
                <p className="text-xs text-slate-400">
                  /{p.slug} · {p.published ? 'Published' : 'Draft'}
                  {p.category ? ` · ${p.category.name}` : ''}
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <Link href={`/admin/blog/${p.id}`} className="text-blue-600 hover:underline">
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
