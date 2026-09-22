import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tags – Telegram Directory',
  description: 'Browse Telegram channels by tag.',
}

function extractTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,#\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 1 && t.length < 40)
}

export default async function TagIndexPage() {
  const entities = await prisma.entity.findMany({
    where: { status: 'APPROVED', tags: { not: null } },
    select: { tags: true },
    take: 2000,
  })

  const counts = new Map<string, number>()
  for (const e of entities) {
    for (const t of extractTags(e.tags)) {
      counts.set(t, (counts.get(t) || 0) + 1)
    }
  }

  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 120)
  const max = tags[0]?.[1] || 1

  return (
    <main className="min-h-screen bg-[#f4f5f7]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2d0808] mb-1">Tags</h1>
        <p className="text-sm text-slate-500 mb-8">
          Popular keywords from channel listings. Click a tag to explore matching media.
        </p>

        {tags.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No tags yet. Tags appear when channels are submitted with keywords or #hashtags.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {tags.map(([tag, count]) => {
              const size = 0.75 + (count / max) * 0.85
              return (
                <Link
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-[#c41e3a]/50 hover:text-[#8b1a1a] transition"
                  style={{ fontSize: `${size}rem` }}
                >
                  #{tag}{' '}
                  <span className="text-[10px] text-slate-400">({count})</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
