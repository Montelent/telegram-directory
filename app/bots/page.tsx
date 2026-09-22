import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Telegram Bots Directory – Telegram Directory',
  description:
    'Discover Telegram bots — tools, music, utilities and mini-apps. Browse by members and rating.',
}

function formatCount(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  return n.toLocaleString()
}

/** Bots: username ends with bot, or tags/source mark bot, or title contains bot */
export default async function BotsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>
}) {
  const sp = await searchParams
  const q = (sp.q || '').trim()
  const sort = sp.sort === 'title' ? 'title' : 'members'

  const orFilters: any[] = [
    { username: { endsWith: 'bot', mode: 'insensitive' } },
    { username: { endsWith: '_bot', mode: 'insensitive' } },
    { tags: { contains: 'bot', mode: 'insensitive' } },
    { source: { equals: 'bot' } },
    { title: { contains: 'bot', mode: 'insensitive' } },
  ]

  const where: any = {
    status: 'APPROVED',
    OR: orFilters,
  }

  if (q) {
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tags: { contains: q, mode: 'insensitive' } },
          { id: { equals: q } },
        ],
      },
    ]
  }

  let entities: any[] = []
  try {
    entities = await prisma.entity.findMany({
      where,
      include: { category: true },
      orderBy: sort === 'title' ? { title: 'asc' } : { memberCount: 'desc' },
      take: 48,
    })
  } catch {
    entities = []
  }

  return (
    <main className="min-h-screen bg-[#f4f5f7]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2332] mb-1">Telegram bots directory</h1>
        <p className="text-sm text-slate-500 mb-6 max-w-2xl">
          Music players, download helpers, mod tools, and mini-apps inside Telegram — sorted by
          members so you can see what people open every week.
        </p>

        <form className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search bots by name or @username…"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <select name="sort" defaultValue={sort} className="rounded-xl border px-3 py-2.5 text-sm">
            <option value="members">Sort by members</option>
            <option value="title">Sort by title</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-[#1a2332] text-white font-semibold text-sm px-5 py-2.5"
          >
            Filter bots
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mb-4 text-xs">
          <Link href="/bots" className="px-3 py-1.5 rounded-full bg-[#1a2332] text-white">
            All bots
          </Link>
          <Link href="/channels" className="px-3 py-1.5 rounded-full bg-white border">
            Channels
          </Link>
          <Link href="/groups" className="px-3 py-1.5 rounded-full bg-white border">
            Groups
          </Link>
          <Link href="/submit" className="px-3 py-1.5 rounded-full bg-white border text-[#8b1a1a]">
            + Submit a bot
          </Link>
        </div>

        <p className="text-xs text-slate-400 mb-3">{entities.length} bots</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {entities.map((e) => (
            <Link
              key={e.id}
              href={'/entity/' + e.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#0088cc]/40 hover:shadow-sm transition"
            >
              <div className="flex items-start gap-3">
                {e.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.photoUrl}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                    {(e.title || '?')[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold uppercase text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                      Bot
                    </span>
                    {e.isFeatured && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-slate-900 truncate">{e.title}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {e.username ? '@' + e.username : 'Bot'}
                    {e.category ? ' · ' + e.category.name : ''}
                  </p>
                  {e.shortDesc || e.description ? (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {e.shortDesc || e.description}
                    </p>
                  ) : null}
                  <p className="text-xs font-semibold text-slate-700 mt-1.5">
                    {formatCount(e.memberCount)} users
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {entities.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 mb-4">No bots listed yet.</p>
            <Link
              href="/submit"
              className="inline-flex rounded-xl bg-[#1a2332] text-white text-sm font-semibold px-5 py-2.5"
            >
              Submit a bot (@username_bot)
            </Link>
            <p className="text-xs text-slate-400 mt-3 max-w-sm mx-auto">
              Tip: usernames ending in bot are auto-detected as bots when approved.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
