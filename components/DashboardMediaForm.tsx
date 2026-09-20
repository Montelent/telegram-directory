'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardMediaForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'CHANNEL' | 'GROUP'>('CHANNEL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOk(false)

    try {
      const res = await fetch('/api/user/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.replace(/^@/, '').trim(),
          title: title || null,
          type,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        setLoading(false)
        return
      }
      setUsername('')
      setTitle('')
      setOk(true)
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username (without @)"
          required
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'CHANNEL' | 'GROUP')}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="CHANNEL">Channel</option>
          <option value="GROUP">Group</option>
        </select>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-600">Submitted for review.</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Add media'}
      </button>
    </form>
  )
}
