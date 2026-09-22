import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tag = decodeURIComponent(slug).toLowerCase().replace(/^#/, '')
  if (!tag) notFound()

  const entities = await prisma.entity.findMany({
    where: {
      status: 'APPROVED',
      tags: { contains: tag, mode: 'insensitive' },
    },
    include: { category: true },
    orderBy: { memberCount: 'desc' },
    take: 60,
  })

  return (
    <main className="min-h-screen bg-[#f4f5f7]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/tag" className="text-xs text-[#8b1a1a] hover:underline">
          ← All tags
        </Link>
        <h1 className="text-2xl font-bold text-[#2d0808] mt-2 mb-1">#{tag}</h1>
        <p className="text-sm text-slate-500 mb-6">{entities.length} channels</p>

        <ul className="space-y-2">
          {entities.map((e) => (
            <li key={e.id}>
              <Link
                href={`/entity/${e.id}`}
                className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-[#c41e3a]/40"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{e.title}</p>
                  <p className="text-xs text-slate-400">
                    {e.username ? `@${e.username}` : e.type}
                    {e.category ? ` · ${e.category.name}` : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold shrink-0">
                  {e.memberCount != null ? e.memberCount.toLocaleString() : '—'}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {entities.length === 0 && (
          <p className="text-slate-500 text-sm">No approved channels with this tag yet.</p>
        )}
      </div>
    </main>
  )
}
