import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function formatCount(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`
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
    <main className="min-h-screen bg-[#faf4f4]">
      <div className="bg-gradient-to-r from-[#2d0808] via-[#4a0e0e] to-[#8b1a1a] text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-wrap gap-2 text-xs mb-4">
            <Link href="/ranking" className="rounded-full bg-white text-[#4a0e0e] font-semibold px-3 py-1">Ranking</Link>
            <Link href="/trending" className="rounded-full bg-white/15 hover:bg-white/25 px-3 py-1">Trending</Link>
            <Link href="/top" className="rounded-full bg-white/15 hover:bg-white/25 px-3 py-1">Rating / Top</Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">Channels Ranking</h1>
          <p className="text-[#f0c8c8] text-sm max-w-2xl">
            Discover the world&apos;s biggest Telegram channels and groups by subscriber count. Updated regularly.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <p className="text-xs text-[#6b5555] mb-4">
          Last update: {new Date().toLocaleString()} · Showing top {entities.length}
        </p>

        {entities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#f0e0e0] p-12 text-center text-[#6b5555]">
            No channels ranked yet. Approve listings in admin.
          </div>
        ) : (
          <ol className="space-y-2">
            {entities.map((e, i) => (
              <li key={e.id}>
                <Link
                  href={`/entity/${e.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-[#f0e0e0] p-3 sm:p-4 hover:border-[#c41e3a]/40 hover:shadow-sm transition"
                >
                  <span className="w-8 text-center text-sm font-bold text-[#c41e3a] shrink-0">#{i + 1}</span>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f8e8e8] to-[#f0d0d0] flex items-center justify-center text-lg shrink-0">
                    {e.type === 'CHANNEL' ? '📢' : '👥'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#2d0808] truncate">{e.title}</p>
                    <p className="text-xs text-[#8b1a1a]">
                      {e.username ? `@${e.username}` : e.type}
                      {e.category ? ` · ${e.category.name}` : ''}
                      {e.language ? ` · ${e.language}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#2d0808] text-sm">{formatCount(e.memberCount)}</p>
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
