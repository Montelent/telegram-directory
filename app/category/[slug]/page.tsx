import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params

  const category = await prisma.category.findUnique({
    where: { slug },
  })

  if (!category) notFound()

  const entities = await prisma.entity.findMany({
    where: {
      status: 'APPROVED',
      categoryId: category.id,
    },
    include: { category: true },
    orderBy: [{ memberCount: 'desc' }, { title: 'asc' }],
    take: 50,
  })

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Home
          </Link>
          <div className="flex items-center gap-3 mt-2">
            {category.icon && <span className="text-3xl">{category.icon}</span>}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{category.name}</h1>
              {category.description && (
                <p className="text-slate-600 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {entities.length} {entities.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {entities.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center text-slate-500">
            No groups or channels in this category yet.
            <div className="mt-4">
              <Link href="/submit" className="text-blue-600 hover:underline">
                Submit one →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entities.map((entity) => (
              <a
                key={entity.id}
                href={entity.username ? `https://t.me/${entity.username}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl border p-5 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{entity.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
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
                {entity.memberCount != null && (
                  <p className="text-xs text-slate-400 mt-2">
                    {entity.memberCount.toLocaleString()} members
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
