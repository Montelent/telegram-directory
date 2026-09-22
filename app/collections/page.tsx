import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Collections – Telegram Directory',
  description: 'Curated collections of Telegram channels and groups.',
}

export default async function PublicCollectionsPage() {
  // Public collections: site_settings keys public_collection:*
  let collections: { id: string; name: string; description: string; items: string[] }[] = []
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { startsWith: 'public_collection:' } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })
    collections = rows.map((r) => {
      try {
        return JSON.parse(r.value)
      } catch {
        return { id: r.key, name: 'Collection', description: '', items: [] }
      }
    })
  } catch {
    collections = []
  }

  // Fallback: show featured / top categories as “collections”
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { entities: true } },
    },
    orderBy: { name: 'asc' },
    take: 24,
  })

  return (
    <main className="min-h-screen bg-[#f4f5f7]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2d0808] mb-1">Collections</h1>
        <p className="text-sm text-slate-500 mb-8">
          Curated lists and category packs — more advanced than a flat directory browse.
        </p>

        {collections.length > 0 && (
          <section className="mb-10">
            <h2 className="font-semibold text-slate-900 mb-3">Featured collections</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {collections.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5"
                >
                  <h3 className="font-bold text-[#2d0808]">{c.name}</h3>
                  {c.description && (
                    <p className="text-sm text-slate-500 mt-1">{c.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">{c.items?.length || 0} channels</p>
                  <ul className="mt-3 space-y-1">
                    {(c.items || []).slice(0, 5).map((u) => (
                      <li key={u} className="text-sm text-[#0088cc]">
                        @{u}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold text-slate-900 mb-3">Browse by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#c41e3a]/40 transition"
              >
                <p className="font-semibold text-sm text-[#2d0808]">{c.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {(c as any)._count?.entities ?? 0} listings
                </p>
              </Link>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="text-sm text-slate-500">No categories yet. Add some in Admin → Categories.</p>
          )}
        </section>

        <p className="mt-8 text-xs text-slate-400">
          Users can also build private collections in{' '}
          <Link href="/dashboard/collections" className="text-[#8b1a1a] hover:underline">
            Dashboard → Collections
          </Link>
          . Admins can publish featured packs via Settings (public_collection keys).
        </p>
      </div>
    </main>
  )
}
