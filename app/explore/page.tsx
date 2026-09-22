import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Explore Telegram Channels – Telegram Directory',
  description: 'Explore channels by language, type, members and category.',
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    type?: string
    lang?: string
    category?: string
    min?: string
    sort?: string
  }>
}) {
  const sp = await searchParams
  const q = (sp.q || '').trim()
  const type = sp.type === 'GROUP' || sp.type === 'CHANNEL' ? sp.type : undefined
  const lang = sp.lang || undefined
  const categorySlug = sp.category || undefined
  const min = parseInt(sp.min || '0', 10) || 0
  const sort = sp.sort === 'title' ? 'title' : 'members'

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  let categoryId: string | undefined
  if (categorySlug) {
    const c = categories.find((x) => x.slug === categorySlug)
    categoryId = c?.id
  }

  const where: any = { status: 'APPROVED' }
  if (type) where.type = type
  if (lang) where.language = lang
  if (categoryId) where.categoryId = categoryId
  if (min > 0) where.memberCount = { gte: min }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { tags: { contains: q, mode: 'insensitive' } },
    ]
  }

  const entities = await prisma.entity.findMany({
    where,
    include: { category: true },
    orderBy: sort === 'title' ? { title: 'asc' } : { memberCount: 'desc' },
    take: 48,
  })

  const languages = await prisma.entity.findMany({
    where: { status: 'APPROVED', language: { not: null } },
    select: { language: true },
    distinct: ['language'],
    take: 40,
  })

  function href(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { q, type, lang, category: categorySlug, min: min ? String(min) : '', sort, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    const s = p.toString()
    return s ? `/explore?${s}` : '/explore'
  }

  return (
    <main className="min-h-screen bg-[#f4f5f7]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2d0808] mb-1">Explore</h1>
        <p className="text-sm text-slate-500 mb-6">
          Filter the directory by keyword, type, language, category and size.
        </p>

        <form className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title, @username, tags…"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm sm:col-span-2 lg:col-span-1"
          />
          <select name="type" defaultValue={type || ''} className="rounded-xl border px-3 py-2.5 text-sm">
            <option value="">All types</option>
            <option value="CHANNEL">Channels</option>
            <option value="GROUP">Groups</option>
          </select>
          <select name="lang" defaultValue={lang || ''} className="rounded-xl border px-3 py-2.5 text-sm">
            <option value="">All languages</option>
            {languages.map((l) =>
              l.language ? (
                <option key={l.language} value={l.language}>
                  {l.language}
                </option>
              ) : null
            )}
          </select>
          <select
            name="category"
            defaultValue={categorySlug || ''}
            className="rounded-xl border px-3 py-2.5 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="min" defaultValue={min ? String(min) : ''} className="rounded-xl border px-3 py-2.5 text-sm">
            <option value="">Any size</option>
            <option value="1000">1K+ members</option>
            <option value="10000">10K+</option>
            <option value="50000">50K+</option>
            <option value="100000">100K+</option>
          </select>
          <select name="sort" defaultValue={sort} className="rounded-xl border px-3 py-2.5 text-sm">
            <option value="members">Sort by members</option>
            <option value="title">Sort by title</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-[#1a2332] text-white font-semibold text-sm py-2.5 sm:col-span-2 lg:col-span-3"
          >
            Apply filters
          </button>
        </form>

        <p className="text-xs text-slate-400 mb-3">{entities.length} results</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {entities.map((e) => (
            <Link
              key={e.id}
              href={`/entity/${e.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#c41e3a]/40 hover:shadow-sm transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#c41e3a]/20 to-[#4a0e0e]/30 flex items-center justify-center font-bold text-[#4a0e0e] shrink-0">
                  {(e.title || '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{e.title}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {e.username ? `@${e.username}` : e.type}
                    {e.category ? ` · ${e.category.name}` : ''}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {e.memberCount != null ? e.memberCount.toLocaleString() : '—'} members
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {entities.length === 0 && (
          <p className="text-center text-slate-500 py-12">No channels match these filters.</p>
        )}

        <div className="mt-8 flex flex-wrap gap-2 text-xs">
          <Link href={href({ type: 'CHANNEL' })} className="px-3 py-1 rounded-full bg-white border">Channels</Link>
          <Link href={href({ type: 'GROUP' })} className="px-3 py-1 rounded-full bg-white border">Groups</Link>
          <Link href={href({ min: '10000' })} className="px-3 py-1 rounded-full bg-white border">10K+</Link>
          <Link href="/explore" className="px-3 py-1 rounded-full bg-white border">Clear</Link>
        </div>
      </div>
    </main>
  )
}
