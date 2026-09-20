'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Cat {
  id: string
  name: string
  slug: string
}

export default function AdminBlogCategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog/categories')
      if (res.ok) setCats(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    await fetch('/api/admin/blog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })
    setName('')
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete category?')) return
    await fetch(`/api/admin/blog/categories/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg">
      <Link href="/admin/blog" className="text-sm text-blue-600 hover:underline">
        ← Blog
      </Link>
      <h1 className="text-xl font-bold mt-2 mb-6">Blog categories</h1>

      <form onSubmit={add} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          required
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm">
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <ul className="bg-white rounded-xl border divide-y">
          {cats.map((c) => (
            <li key={c.id} className="px-4 py-3 flex justify-between text-sm">
              <span>
                {c.name}{' '}
                <span className="text-slate-400">/{c.slug}</span>
              </span>
              <button onClick={() => remove(c.id)} className="text-red-600 text-xs">
                Delete
              </button>
            </li>
          ))}
          {cats.length === 0 && (
            <li className="px-4 py-6 text-center text-slate-400">No categories</li>
          )}
        </ul>
      )}
    </div>
  )
}
