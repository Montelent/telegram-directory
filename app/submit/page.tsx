'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SubmitPage() {
  const [link, setLink] = useState('')
  const [fetched, setFetched] = useState<{
    username: string
    title: string
    description: string
    type: 'GROUP' | 'CHANNEL'
  } | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'GROUP' | 'CHANNEL'>('CHANNEL')
  const [status, setStatus] = useState<'idle' | 'fetching' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showRules, setShowRules] = useState(false)

  function parseTelegramLink(raw: string) {
    const cleaned = raw.trim()
    const match = cleaned.match(/(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)?@?([a-zA-Z0-9_]{4,})/)
    return match ? match[1] : cleaned.replace(/^@/, '')
  }

  async function handleFetch() {
    const username = parseTelegramLink(link)
    if (!username) {
      setMessage('Enter a valid Telegram link or @username')
      setStatus('error')
      return
    }
    setStatus('fetching')
    setMessage('')
    // Local parse first; API enrichment optional
    setFetched({
      username,
      title: username,
      description: '',
      type: 'CHANNEL',
    })
    setTitle(username)
    setType('CHANNEL')
    setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const username = fetched?.username || parseTelegramLink(link)
    if (!username) {
      setStatus('error')
      setMessage('Fetch a media link first')
      return
    }
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          title: title || username,
          description,
          type,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(typeof data.error === 'string' ? data.error : 'Something went wrong')
        return
      }
      setStatus('success')
      setMessage('Thank you! Your submission is pending review.')
      setLink('')
      setFetched(null)
      setTitle('')
      setDescription('')
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6fa]">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#5c4040] bg-white border border-[#e8e0e0] rounded-full px-3 py-1">
            🔗 Media
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1212] mb-1">Add media</h1>
        <p className="text-sm text-[#6b5555] mb-4">
          Paste a Telegram link, fetch it, then complete the listing.
        </p>

        <Link href="/dashboard/media" className="inline-flex items-center text-sm text-[#8b1a1a] hover:underline mb-5">
          ← Media list
        </Link>

        <button
          type="button"
          onClick={() => setShowRules(!showRules)}
          className="w-full mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm"
        >
          <span className="text-amber-600">⚠</span>
          <span className="font-semibold text-amber-900">Submission rules</span>
          <span className="text-amber-700/80">Read before you add</span>
        </button>

        {showRules && (
          <div className="mb-5 rounded-xl border border-amber-100 bg-white px-4 py-3 text-xs text-[#5c4040] space-y-1">
            <p>• Only public channels and groups</p>
            <p>• No scam, phishing, or illegal content</p>
            <p>• Accurate title and description required</p>
            <p>• Admins may reject or edit listings</p>
          </div>
        )}

        {status === 'success' ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6">
            <p className="font-medium">{message}</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 text-sm underline text-emerald-700"
            >
              Submit another
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e8e0e0] shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#3a2a2a] mb-2">Media&apos;s Link</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://t.me/dailychannels"
                className="w-full rounded-xl border border-[#e0d5d5] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/40"
              />
              <button
                type="button"
                onClick={handleFetch}
                disabled={status === 'fetching' || !link.trim()}
                className="mt-3 w-full rounded-xl bg-[#1a2332] hover:bg-[#0f1620] text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                <span>☁</span> {status === 'fetching' ? 'Fetching…' : 'Fetch'}
              </button>
              <p className="text-xs text-[#9a8888] mt-2">Enter your Telegram media link</p>
            </div>

            {fetched && (
              <form onSubmit={handleSubmit} className="space-y-4 border-t border-[#f0e8e8] pt-4">
                <p className="text-xs font-semibold text-[#8b1a1a] uppercase tracking-wide">
                  Complete listing · @{fetched.username}
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'GROUP' | 'CHANNEL')}
                    className="w-full rounded-xl border border-[#e0d5d5] px-3 py-2.5 text-sm"
                  >
                    <option value="CHANNEL">Channel</option>
                    <option value="GROUP">Group</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#e0d5d5] px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-[#e0d5d5] px-3 py-2.5 text-sm"
                    placeholder="What is this about?"
                  />
                </div>
                {status === 'error' && <p className="text-sm text-[#c41e3a]">{message}</p>}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-xl bg-gradient-to-r from-[#8b1a1a] to-[#4a0e0e] text-white font-semibold py-3 text-sm disabled:opacity-50"
                >
                  {status === 'loading' ? 'Submitting…' : 'Submit for review'}
                </button>
              </form>
            )}

            {status === 'error' && !fetched && (
              <p className="text-sm text-[#c41e3a]">{message}</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
