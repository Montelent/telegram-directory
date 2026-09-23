import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { entityPath } from '@/lib/entity-path'

export const dynamic = 'force-dynamic'

function formatCount(n: number | null | undefined) {
  if (n == null) return '\u2014'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  return n.toLocaleString()
}

export default async function RankingPage() {
  const entities = await prisma.entity.findMany({
    where: { status: 'APPROVED' },
    include: { category: true },
    orderBy: [{ memberCount: 'desc' }, { title: 'asc' }],
    take: 100,
  })

  return (
    <main className="min-h-screen bg-[#faf4f4] overflow-x-hidden">
      <div className="bg-gradient-to-r from-[#2d0808] via-[#4a0e0e] to-[#8b1a1a] text-white">
        <div className="container mx-auto px-3 sm:px-4 py-10 max-w-full">
          <div className="flex flex-wrap gap-2 text-xs mb-4">
            <Link
              href="/ranking"
              className="rounded-full bg-white text-[#4a0e0e] font-semibold px-3 py-1"
            >
              Ranking
            </Link>
            <Link
              href="/trending"
              className="rounded-full bg-white/15 hover:bg-white/25 px-3 py-1"
            >
              Trending
            </Link>
            <Link href="/top" className="rounded-full bg-white/15 hover:bg-white/25 px-3 py-1">
              Rating / Top
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Channels Ranking</h1>
          <p className="text-[#f0c8c8] text-sm max-w-2xl">
            Discover the world's biggest Telegram channels and groups by subscriber count.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-8 max-w-3xl">
        <p className="text-xs text-[#6b5555] mb-4">
          Last update: {new Date().toLocaleString()} \u00b7 Showing top {entities.length}
        </p>

        {entities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#f0e0e0] p-12 text-center text-[#6b5555]">
            No channels ranked yet. Approve listings in admin.
          </div>
        ) : (
          <ol className="space-y-2">
            {entities.map((e, i) => (
              <li key={e.id} className="min-w-0">
                <Link
                  href={entityPath(e)}
                  className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl border border-[#f0e0e0] p-3 sm:p-4 hover:border-[#c41e3a]/40 hover:shadow-sm transition min-w-0 overflow-hidden"
                >
                  <span className="w-7 sm:w-8 text-center text-xs sm:text-sm font-bold text-[#c41e3a] shrink-0">
                    #{i + 1}
                  </span>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#f8e8e8] to-[#f0d0d0] flex items-center justify-center text-base sm:text-lg shrink-0">
                    {e.type === 'CHANNEL' ? '\ud83d\udce2' : '\ud83d\udc65'}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="font-semibold text-[#2d0808] truncate">{e.title}</p>
                    <p className="text-xs text-[#8b1a1a] truncate">
                      {e.username ? '@' + e.username : e.type}
                      {e.category ? ' \u00b7 ' + e.category.name : ''}
                      {e.language ? ' \u00b7 ' + e.language : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0 max-w-[4.5rem] sm:max-w-none">
                    <p className="font-bold text-[#2d0808] text-xs sm:text-sm tabular-nums">
                      {formatCount(e.memberCount)}
                    </p>
                    <p className="text-[10px] text-[#6b5555] uppercase">subs</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  )
}
