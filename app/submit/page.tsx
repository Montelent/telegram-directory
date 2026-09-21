'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const TinyMCEEditor = dynamic(() => import('@/components/TinyMCEEditor'), { ssr: false })

const LANGUAGES = ['English', 'Spanish', 'French', 'Arabic', 'Portuguese', 'German', 'Russian', 'Hindi', 'Chinese', 'Other']
const COUNTRIES = ['Global', 'United States', 'Nigeria', 'United Kingdom', 'India', 'Brazil', 'Germany', 'France', 'Other']

export default function SubmitPage() {
  const [link, setLink] = useState('')
  const [step, setStep] = useState<'link' | 'form' | 'done'>('link')
  const [username, setUsername] = useState('')
  const [title, setTitle] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [longDesc, setLongDesc] = useState('')
  const [tags, setTags] = useState('')
  const [language, setLanguage] = useState('English')
  const [country, setCountry] = useState('Global')
  const [category, setCategory] = useState('other')
  const [type, setType] = useState<'GROUP' | 'CHANNEL'>('CHANNEL')
  const [nsfw, setNsfw] = useState(false)
  const [feature, setFeature] = useState(false)
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([])
  const [status, setStatus] = useState<'idle' | 'fetching' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showRules, setShowRules] = useState(false)
  const featurePrice = 20

  function parseTelegramLink(raw: string) {
    const cleaned = raw.trim()
    const match = cleaned.match(/(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)?@?([a-zA-Z0-9_]{4,})/i)
    return match ? match[1] : cleaned.replace(/^@/, '').replace(/\s/g, '')
  }

  async function handleFetch() {
    const u = parseTelegramLink(link)
    if (!u || u.length < 4) {
      setMessage('Enter a valid Telegram link or username')
      setStatus('error')
      return
    }
    setStatus('fetching')
    setMessage('')
    try {
      const catsRes = await fetch('/api/categories')
      if (catsRes.ok) {
        const cats = await catsRes.json()
        if (Array.isArray(cats)) setCategories(cats.map((c: any) => ({ slug: c.slug, name: c.name })))
      }
    } catch { /* */ }

    setUsername(u)
    setTitle(u)
    setShortDesc('')
    setLongDesc('')
    setStep('form')
    setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username) return
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          title: title.slice(0, 120),
          shortDesc: shortDesc.slice(0, 170),
          longDesc,
          tags,
          type,
          language,
          country,
          isNsfw: nsfw,
          wantFeature: feature,
          notes: `Category: ${category}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(typeof data.error === 'string' ? data.error : 'Submission failed — run full_migration.sql in Supabase')
        return
      }
      setStep('done')
      setStatus('idle')
    } catch {
      setStatus('error')
      setMessage('Network error')
    }
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5]">
      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-lg">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-1 mb-3">
          🔗 Media
        </span>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Add media</h1>
        <p className="text-sm text-slate-500 mb-3">
          Paste a Telegram link, fetch it, then complete the listing.
        </p>

        <Link href="/dashboard/media" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Media list
        </Link>

        <button
          type="button"
          onClick={() => setShowRules(!showRules)}
          className="w-full mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm"
        >
          <span className="text-amber-600">⚠</span>
          <span className="font-semibold text-amber-900">Submission rules</span>
          <span className="text-amber-700/70">Read before you add</span>
        </button>

        {showRules && (
          <div className="mb-4 rounded-xl bg-white border border-amber-100 px-4 py-3 text-xs text-slate-600 space-y-1">
            <p>• Public channels/groups only</p>
            <p>• No scams, phishing, or illegal content</p>
            <p>• Honest titles and descriptions</p>
            <p>• Admins may edit or reject listings</p>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-800">
            <p className="font-semibold">Saved to database</p>
            <p className="text-sm mt-1">Submission is pending admin review in Supabase / Admin → Submissions.</p>
            <button
              type="button"
              onClick={() => {
                setStep('link')
                setLink('')
                setUsername('')
              }}
              className="mt-4 text-sm underline"
            >
              Add another
            </button>
          </div>
        )}

        {step === 'link' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Media's Link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://t.me/dailychannels or @username"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20"
            />
            <button
              type="button"
              onClick={handleFetch}
              disabled={status === 'fetching' || !link.trim()}
              className="mt-3 w-full rounded-xl bg-[#1a2332] hover:bg-[#0f1620] text-white font-semibold py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              ☁ {status === 'fetching' ? 'Fetching…' : 'Fetch'}
            </button>
            <p className="text-xs text-slate-400 mt-2">Enter your Telegram media link</p>
            {status === 'error' && <p className="text-sm text-red-600 mt-2">{message}</p>}
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg shrink-0">
                📢
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">{title || username}</p>
                <p className="text-xs text-slate-400">@{username}</p>
              </div>
            </div>

            <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div>
                <h2 className="font-semibold text-slate-900">About</h2>
                <p className="text-xs text-slate-400">Name, description and tags</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Media Name</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={45}
                  required
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Keep it less than 45 characters</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Short Description</label>
                <textarea
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  maxLength={170}
                  rows={3}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Used in search results and Google snippets. Aim for 150–170 characters."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Type a tag…"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Up to five keywords</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Long Description</label>
                <TinyMCEEditor value={longDesc} onChange={setLongDesc} height={280} />
                <p className="text-[11px] text-slate-400 mt-1">A few paragraphs help SEO. Aim for about 300 words.</p>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div>
                <h2 className="font-semibold text-slate-900">Classification</h2>
                <p className="text-xs text-slate-400">Language, country, and category</p>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'GROUP' | 'CHANNEL')}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="CHANNEL">Channel</option>
                  <option value="GROUP">Group</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="other">other</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-start gap-2 text-sm pt-1">
                <input type="checkbox" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} className="mt-0.5" />
                <span>
                  <span className="font-medium">Mark as NSFW</span>
                  <span className="block text-xs text-slate-400">Not safe for work or family. May include adult content.</span>
                </span>
              </label>
            </section>

            <section className="bg-amber-50/80 rounded-2xl border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-600">⭐</span>
                <h2 className="font-semibold text-slate-900">Feature (optional)</h2>
              </div>
              <p className="text-xs text-slate-500 mb-3">Skip approval and get more visibility</p>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={feature} onChange={(e) => setFeature(e.target.checked)} className="mt-0.5" />
                <span>
                  <span className="font-medium">Feature this media</span>
                  <span className="ml-2 font-bold text-slate-800">${featurePrice}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Shown on the Homepage, category tops, related lists, and relevant search results.
                  </span>
                </span>
              </label>
            </section>

            {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

            <div className="flex gap-3 pt-1 pb-8">
              <button
                type="button"
                onClick={() => setStep('link')}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex-1 rounded-xl bg-[#1a2332] hover:bg-[#0f1620] py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {status === 'loading' ? 'Saving…' : 'ADD'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
