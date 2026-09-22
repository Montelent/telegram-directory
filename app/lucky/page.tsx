import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

/** I'm Feeling Lucky — random approved channel */
export default async function LuckyPage() {
  const total = await prisma.entity.count({ where: { status: 'APPROVED' } })
  if (total === 0) {
    return (
      <main className="min-h-screen bg-[#faf4f4] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No channels to discover yet.</p>
          <Link href="/submit" className="text-[#8b1a1a] font-medium hover:underline">
            Add the first one →
          </Link>
        </div>
      </main>
    )
  }

  const skip = Math.floor(Math.random() * total)
  const entity = await prisma.entity.findFirst({
    where: { status: 'APPROVED' },
    skip,
    orderBy: { id: 'asc' },
  })

  if (!entity) redirect('/explore')
  redirect(`/entity/${entity.id}`)
}
