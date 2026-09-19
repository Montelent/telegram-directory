'use client'

import { useState } from 'react'

export default function SubmitPage() {
  const [username, setUsername] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'GROUP' | 'CHANNEL'>('GROUP')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, title, description, type }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong')
        return
      }

      setStatus('success')
      setMessage('Thank you! Your submission has been received and is pending review.')
      setUsername('')
      setTitle('')
      setDescription('')
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <h1 className="text-3xl font-bold mb-2">Submit a Group or Channel</h1>
        <p className="text-slate-600 mb-8">
          Suggest a public Telegram group or channel. All submissions are reviewed by admins before appearing in the directory.
        </p>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6">
            <p className="font-medium">{message}</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 text-sm text-green-700 underline"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border shadow-sm">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username or Invite Link *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@example or https://t.me/example"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'GROUP' | 'CHANNEL')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GROUP">Group</option>
                <option value="CHANNEL">Channel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Display name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Short Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What is this group/channel about?"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-600">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
