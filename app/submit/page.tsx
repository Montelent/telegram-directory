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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [memberCount, setMemberCount] = useState<number | null>(null)
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

  async function handleFetch() {
    if (!link.trim()) {
      setMessage('Enter a valid Telegram link or username')
      setStatus('error')
      return
    }
    setStatus('fetching')
    setMessage('')

    try {
      const [fetchRes, catsRes] = await Promise.all([
        fetch('/api/media/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link }),
        }),
        fetch('/api/categories'),
      ])

      if (catsRes.ok) {
        const cats = await catsRes.json()
        if (Array.isArray(cats)) setCategories(cats.map((c: any) => ({ slug: c.slug, name: c.name })))
      }

      const data = await fetchRes.json()
      if (!fetchRes.ok) {
        setStatus('error')
        setMessage(data.error || 'Fetch failed')
        return
      }

      setUsername(data.username)
      setTitle(data.title || data.username)
      setShortDesc(data.shortDesc || '')
      setLongDesc(data.longDesc || data.shortDesc || '')
      setPhotoUrl(data.photoUrl || null)
      setMemberCount(data.memberCount ?? null)
      if (data.type === 'GROUP' || data.type === 'CHANNEL') setType(data.type)

      // Auto-suggest tags from hashtags in description
      const hashTags = String(data.shortDesc || data.longDesc || '').match(/#[\w]+/g)
      if (hashTags?.length) {
        setTags([...new Set(hashTags.map((t: string) => t.replace(/^#/, '')))].slice(0, 5).join(', '))
      }

      if (data.warning) setMessage(data.warning)
      setStep('form')
      setStatus('idle')
    } catch {
      setStatus('error')
      setMessage('Network error while fetching')
    }
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
          notes: [
            `Category: ${category}`,
            photoUrl ? `photo:${photoUrl}` : '',
            memberCount != null ? `members:${memberCount}` : '',
          ]
            .filter(Boolean)
            .join(' | '),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(typeof data.error === 'string' ? data.error : 'Submission failed')
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
            <p className="text-sm mt-1">Pending admin review.</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Media&apos;s Link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://t.me/dailychannels or coursecouponclub"
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
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg shrink-0">
                  📢
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">{title || username}</p>
                <p className="text-xs text-slate-400">
                  @{username}
                  {memberCount != null ? ` · ${memberCount.toLocaleString()} members` : ''}
                </p>
              </div>
            </div>

            {message && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{message}</p>
            )}

            <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div>
                <h2 className="font-semibold text-slate-900">About</h2>
                <p className="text-xs text-slate-400">Name, description and tags — prefilled from Telegram</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Media Name</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">{title.length}/120 · from Telegram title</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Short Description</label>
                <textarea
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  maxLength={170}
                  rows={4}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Used in search results and Google snippets."
                />
                <p className="text-[11px] text-slate-400 mt-0.5">{shortDesc.length}/170 · from Telegram about</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="udemy, coupon, courses"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Auto-filled from #hashtags when found</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Long Description</label>
                <TinyMCEEditor value={longDesc} onChange={setLongDesc} height={280} />
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
                  <span className="block text-xs text-slate-400">Not safe for work or family.</span>
                </span>
              </label>
            </section>

            <section className="bg-amber-50/80 rounded-2xl border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-600">⭐</span>
                <h2 className="font-semibold text-slate-900">Feature (optional)</h2>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={feature} onChange={(e) => setFeature(e.target.checked)} className="mt-0.5" />
                <span>
                  <span className="font-medium">Feature this media</span>
                  <span className="ml-2 font-bold">${featurePrice}</span>
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
