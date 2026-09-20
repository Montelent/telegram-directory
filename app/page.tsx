import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [categories, recentEntities, totalApproved] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            entities: { where: { status: 'APPROVED' } },
          },
        },
      },
    }),
    prisma.entity.findMany({
      where: { status: 'APPROVED' },
      include: { category: true },
      orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    }),
    prisma.entity.count({ where: { status: 'APPROVED' } }),
  ])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="container mx-auto px-4 py-14 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
          Telegram Directory
        </h1>
        <p className="text-lg text-slate-600 mb-2 max-w-2xl mx-auto">
          Discover public Telegram groups and channels. Browse categories, read reviews, then open in Telegram.
        </p>
        {totalApproved > 0 && (
          <p className="text-sm text-slate-500 mb-8">
            {totalApproved.toLocaleString()} groups & channels indexed
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition"
          >
            Search Groups & Channels
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            Submit a Group
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Browse by Category</h2>
            <Link href="/search" className="text-sm text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="bg-white rounded-xl border p-5 hover:border-blue-300 hover:shadow-sm transition text-left"
              >
                <div className="text-2xl mb-2">{cat.icon || '📁'}</div>
                <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {cat._count.entities} {cat._count.entities === 1 ? 'entry' : 'entries'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentEntities.length > 0 && (
        <section className="container mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Popular & Recent</h2>
            <Link href="/search" className="text-sm text-blue-600 hover:underline">
              Search all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentEntities.map((entity) => (
              <Link
                key={entity.id}
                href={entity.username ? `/g/${entity.username}` : `/g/${entity.id}`}
                className="bg-white rounded-xl border p-5 hover:border-blue-300 hover:shadow-sm transition block"
              >
                <div className="flex items-start gap-3">
                  {entity.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entity.photoUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0">
                      {entity.type === 'CHANNEL' ? '📢' : '👥'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{entity.title}</h3>
                      {entity.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          entity.type === 'CHANNEL'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {entity.type}
                      </span>
                    </div>
                    {entity.username && (
                      <p className="text-sm text-blue-600">@{entity.username}</p>
                    )}
                    {entity.description && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{entity.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-slate-400">
                      {entity.category && <span>{entity.category.name}</span>}
                      {entity.memberCount != null && (
                        <span>{entity.memberCount.toLocaleString()} members</span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-2 font-medium">View details →</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 && recentEntities.length === 0 && (
        <section className="container mx-auto px-4 pb-20 text-center">
          <div className="bg-white rounded-xl border p-10 max-w-lg mx-auto">
            <p className="text-slate-600 mb-4">
              No channels yet. Import via Admin → API Integrations (telegramchannels.me) or submit a group.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/admin/integrations" className="text-blue-600 hover:underline text-sm">
                Admin integrations
              </Link>
              <Link href="/submit" className="text-blue-600 hover:underline text-sm">
                Submit a group
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t py-8 text-center text-sm text-slate-500">
        Telegram directory · <Link href="/admin" className="text-blue-600 hover:underline">Admin</Link>
      </footer>
    </main>
  )
}
