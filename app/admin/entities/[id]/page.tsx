'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import EntitySeoPanel, { defaultEntitySeoData, buildEntityJsonLd, EntitySeoData } from '@/components/EntitySeoPanel'

interface Category {
  id: string
  name: string
}

export default function EditEntityPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [username, setUsername] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [longDesc, setLongDesc] = useState('')
  const [tags, setTags] = useState('')
  const [language, setLanguage] = useState('')
  const [country, setCountry] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [memberCount, setMemberCount] = useState<number | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [status, setStatus] = useState('PENDING')
  const [isVerified, setIsVerified] = useState(false)
  const [isScam, setIsScam] = useState(false)
  const [isNsfw, setIsNsfw] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)

  const [seo, setSeo] = useState<EntitySeoData>(defaultEntitySeoData)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSeoMobile, setShowSeoMobile] = useState(false)

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setCategories(d)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/admin/entities/${params.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then((e) => {
        setTitle(e.title || '')
        setUsername(e.username || '')
        setShortDesc(e.shortDesc || e.description || '')
        setLongDesc(e.longDesc || '')
        setTags(e.tags || '')
        setLanguage(e.language || '')
        setCountry(e.country || '')
        setInviteLink(e.inviteLink || '')
        setPhotoUrl(e.photoUrl || '')
        setMemberCount(e.memberCount ?? '')
        setCategoryId(e.categoryId || '')
        setStatus(e.status || 'PENDING')
        setIsVerified(!!e.isVerified)
        setIsScam(!!e.isScam)
        setIsNsfw(!!e.isNsfw)
        setIsFeatured(!!e.isFeatured)
        setSeo({
          ...defaultEntitySeoData,
          seoTitle: e.seoTitle || '',
          seoDescription: e.seoDescription || '',
          focusKeyword: e.focusKeyword || '',
          canonical: e.canonicalUrl || '',
          robots: e.robots || 'index,follow',
          ogImage: e.ogImage || '',
          // Existing entities may already have JSON-LD saved (or none at
          // all, since the public page used to hardcode it). Only treat it
          // as an override if it's actually present.
          jsonLdOverride: e.seoJsonLd || null,
        })
      })
      .catch(() => setError('Could not load this entity.'))
      .finally(() => setLoading(false))
  }, [params.id])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const selectedCategory = categories.find((c) => c.id === categoryId)
    const seoJsonLd =
      seo.jsonLdOverride ??
      buildEntityJsonLd({
        data: seo,
        title,
        entityId: params.id,
        username,
        description: shortDesc,
        photoUrl,
        memberCount: memberCount === '' ? null : Number(memberCount),
        categoryName: selectedCategory?.name || null,
        categorySlug: null,
        siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
        siteName: 'Site',
      })

    const res = await fetch(`/api/admin/entities/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        username: username || null,
        shortDesc: shortDesc || null,
        longDesc: longDesc || null,
        tags: tags || null,
        language: language || null,
        country: country || null,
        inviteLink: inviteLink || null,
        photoUrl: photoUrl || null,
        memberCount: memberCount === '' ? null : Number(memberCount),
        categoryId: categoryId || null,
        status,
        isVerified,
        isScam,
        isNsfw,
        isFeatured,
        seoTitle: seo.seoTitle || title,
        seoDescription: seo.seoDescription || shortDesc,
        seoJsonLd,
        focusKeyword: seo.focusKeyword,
        canonicalUrl: seo.canonical || null,
        robots: seo.robots,
        ogImage: seo.ogImage || null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to save')
      return
    }
    router.push('/admin/entities')
  }

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>

  if (error && !title) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <Link href="/admin/entities" className="text-sm text-blue-600 hover:underline">
          ← Back to Groups & Channels
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/admin/entities" className="text-sm text-blue-600 hover:underline">
        ← Groups & Channels
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="text-xl font-bold">Edit entity</h1>
        <button
          type="button"
          onClick={() => setShowSeoMobile(true)}
          className="lg:hidden rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          SEO settings
        </button>
      </div>

      <form onSubmit={save} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="without @"
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Member count</label>
              <input
                type="number"
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Language</label>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Invite link</label>
            <input
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              placeholder="https://t.me/…"
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Photo URL</label>
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…"
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="crypto, signals, news"
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Short description</label>
            <textarea
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              rows={2}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Long description</label>
            <textarea
              value={longDesc}
              onChange={(e) => setLongDesc(e.target.value)}
              rows={6}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} />
              Verified
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isNsfw} onChange={(e) => setIsNsfw(e.target.checked)} />
              NSFW
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isScam} onChange={(e) => setIsScam(e.target.checked)} />
              Flag as scam
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>

        <div className="hidden lg:block">
          <EntitySeoPanel
            title={title}
            entityId={params.id}
            username={username}
            description={shortDesc}
            photoUrl={photoUrl}
            memberCount={memberCount === '' ? null : Number(memberCount)}
            categoryName={categories.find((c) => c.id === categoryId)?.name}
            data={seo}
            onChange={setSeo}
          />
        </div>
      </form>

      {showSeoMobile && (
        <div className="lg:hidden fixed inset-0 z-[70] flex justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowSeoMobile(false)} />
          <div className="relative w-full sm:w-[420px] max-w-full bg-[#faf4f4] h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
              <span className="font-semibold text-sm">SEO settings</span>
              <button onClick={() => setShowSeoMobile(false)} className="p-1.5" aria-label="Close">✕</button>
            </div>
            <div className="p-3">
              <EntitySeoPanel
                title={title}
                entityId={params.id}
                username={username}
                description={shortDesc}
                photoUrl={photoUrl}
                memberCount={memberCount === '' ? null : Number(memberCount)}
                categoryName={categories.find((c) => c.id === categoryId)?.name}
                data={seo}
                onChange={setSeo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
