import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import CompareClient from '@/components/CompareClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Compare Telegram Channels – Telegram Directory',
  description: 'Compare subscribers, language, category and ratings side by side.',
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; c?: string }>
}) {
  const sp = await searchParams
  const ids = [sp.a, sp.b, sp.c].filter(Boolean) as string[]

  let selected: any[] = []
  if (ids.length) {
    selected = await prisma.entity.findMany({
      where: { id: { in: ids }, status: 'APPROVED' },
      include: { category: true },
    })
  }

  const pool = await prisma.entity.findMany({
    where: { status: 'APPROVED' },
    orderBy: { memberCount: 'desc' },
    take: 80,
    select: { id: true, title: true, username: true, memberCount: true },
  })

  return (
    <main className="min-h-screen bg-[#f4f5f7]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2d0808] mb-1">Compare channels</h1>
        <p className="text-sm text-slate-500 mb-6">
          Pick up to 3 channels and compare members, language, category, verification and more.
        </p>
        <CompareClient pool={pool} initialSelected={JSON.parse(JSON.stringify(selected))} />
        <p className="mt-8 text-xs text-slate-400">
          Tip: open a channel page, then use the URL{' '}
          <code className="bg-white px-1 rounded">/compare?a=ID&b=ID</code>
        </p>
      </div>
    </main>
  )
}
