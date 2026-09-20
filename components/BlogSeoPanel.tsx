'use client'

/** RankMath / Yoast style SEO sidebar for blog posts */
export default function BlogSeoPanel({
  title,
  slug,
  seoTitle,
  setSeoTitle,
  seoDescription,
  setSeoDescription,
  focusKeyword,
  setFocusKeyword,
  canonical,
  setCanonical,
  robots,
  setRobots,
}: {
  title: string
  slug: string
  seoTitle: string
  setSeoTitle: (v: string) => void
  seoDescription: string
  setSeoDescription: (v: string) => void
  focusKeyword: string
  setFocusKeyword: (v: string) => void
  canonical: string
  setCanonical: (v: string) => void
  robots: string
  setRobots: (v: string) => void
}) {
  const previewTitle = (seoTitle || title || 'Post title').slice(0, 60)
  const previewDesc = (seoDescription || 'Meta description will appear here.').slice(0, 160)
  const titleLen = (seoTitle || title).length
  const descLen = seoDescription.length

  function score(): { label: string; color: string } {
    let s = 0
    if (titleLen >= 30 && titleLen <= 60) s += 25
    else if (titleLen > 0) s += 10
    if (descLen >= 120 && descLen <= 160) s += 25
    else if (descLen > 40) s += 10
    if (focusKeyword && (seoTitle || title).toLowerCase().includes(focusKeyword.toLowerCase())) s += 25
    if (focusKeyword && seoDescription.toLowerCase().includes(focusKeyword.toLowerCase())) s += 25
    if (s >= 70) return { label: 'Good', color: 'text-green-600' }
    if (s >= 40) return { label: 'OK', color: 'text-yellow-600' }
    return { label: 'Needs work', color: 'text-red-600' }
  }

  const sc = score()

  return (
    <div className="bg-white rounded-xl border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">SEO (RankMath-style)</h3>
        <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
      </div>

      {/* SERP preview */}
      <div className="rounded-lg border bg-slate-50 p-3">
        <p className="text-xs text-slate-400 mb-1">SERP preview</p>
        <p className="text-blue-700 text-base leading-snug truncate">{previewTitle}</p>
        <p className="text-green-700 text-xs truncate">
          yoursite.com/blog/{slug || 'slug'}
        </p>
        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{previewDesc}</p>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Focus keyword</label>
        <input
          value={focusKeyword}
          onChange={(e) => setFocusKeyword(e.target.value)}
          className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
          placeholder="e.g. telegram channels"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs">
          <label className="font-medium text-slate-600">SEO title</label>
          <span className={titleLen > 60 ? 'text-red-500' : 'text-slate-400'}>{titleLen}/60</span>
        </div>
        <input
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
          placeholder="Defaults to post title"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs">
          <label className="font-medium text-slate-600">Meta description</label>
          <span className={descLen > 160 ? 'text-red-500' : 'text-slate-400'}>{descLen}/160</span>
        </div>
        <textarea
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={3}
          className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
          placeholder="Compelling summary for search results"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Canonical URL (optional)</label>
        <input
          value={canonical}
          onChange={(e) => setCanonical(e.target.value)}
          className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
          placeholder="https://…"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Robots</label>
        <select
          value={robots}
          onChange={(e) => setRobots(e.target.value)}
          className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
        >
          <option value="index,follow">index, follow</option>
          <option value="noindex,follow">noindex, follow</option>
          <option value="index,nofollow">index, nofollow</option>
          <option value="noindex,nofollow">noindex, nofollow</option>
        </select>
      </div>

      <p className="text-[11px] text-slate-400">
        JSON-LD BlogPosting schema is generated automatically on save.
      </p>
    </div>
  )
}
