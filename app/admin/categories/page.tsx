'use client'

import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  _count?: { entities: number }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) setCategories(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', icon: '' })
    setError('')
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '',
    })
    setError('')
    setShowForm(true)
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const url = editing
        ? `/api/admin/categories/${editing.id}`
        : '/api/admin/categories'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || generateSlug(form.name),
          description: form.description || null,
          icon: form.icon || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to save')
        return
      }

      setShowForm(false)
      await load()
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Entities will be unlinked but not deleted.')) return

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (res.ok) await load()
    } catch {
      alert('Failed to delete')
    }
  }

  return (
    <div>
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Manage Categories</h1>
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700"
          >
            + New Category
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {showForm && (
          <div className="bg-white rounded-xl border p-6 mb-8 max-w-lg">
            <h2 className="font-semibold mb-4">
              {editing ? 'Edit Category' : 'Create Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: f.slug || generateSlug(name),
                    }))
                  }}
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">Lowercase, numbers, hyphens only</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon (emoji or text)</label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="🚀"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
            No categories yet. Create one or run <code className="bg-slate-100 px-1 rounded">npm run db:seed</code>.
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Slug</th>
                  <th className="text-left px-4 py-3 font-medium">Entities</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      {cat.icon && <span className="mr-2">{cat.icon}</span>}
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{cat.slug}</td>
                    <td className="px-4 py-3">{cat._count?.entities ?? 0}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
