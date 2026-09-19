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
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.entity.count({ where: { status: 'APPROVED' } }),
  ])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
          Telegram Directory
        </h1>
        <p className="text-lg text-slate-600 mb-2 max-w-2xl mx-auto">
          Discover public Telegram groups and channels. Search by topic, browse categories, and submit your own.
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

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 pb-16">
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

      {/* Recent */}
      {recentEntities.length > 0 && (
        <section className="container mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Recently Added</h2>
            <Link href="/search" className="text-sm text-blue-600 hover:underline">
              Search all →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentEntities.map((entity) => (
              <a
                key={entity.id}
                href={entity.username ? `https://t.me/${entity.username}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl border p-5 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 truncate">{entity.title}</h3>
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
                  {entity.category && (
                    <Link
                      href={`/category/${entity.category.slug}`}
                      className="hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {entity.category.name}
                    </Link>
                  )}
                  {entity.memberCount != null && (
                    <span>{entity.memberCount.toLocaleString()} members</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {categories.length === 0 && recentEntities.length === 0 && (
        <section className="container mx-auto px-4 pb-20 text-center">
          <div className="bg-white rounded-xl border p-10 max-w-md mx-auto">
            <p className="text-slate-600 mb-4">
              The directory is empty. Seed categories and start submitting groups.
            </p>
            <code className="text-xs bg-slate-100 px-2 py-1 rounded">npm run db:seed</code>
          </div>
        </section>
      )}

      <footer className="border-t py-8 text-center text-sm text-slate-500">
        Built with Next.js · <Link href="/admin" className="text-blue-600 hover:underline">Admin</Link>
      </footer>
    </main>
  )
}
