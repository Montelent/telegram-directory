import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CollectionsClient from '@/components/CollectionsClient'

export const dynamic = 'force-dynamic'

export default async function DashboardCollectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') redirect('/login')

  const userId = (session.user as any).id as string

  // Collections stored as site_settings keys collection:{userId}:{id} JSON — or table if exists
  let collections: { id: string; name: string; description: string; items: string[] }[] = []

  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { startsWith: `collection:${userId}:` } },
    })
    collections = rows.map((r) => {
      try {
        return JSON.parse(r.value)
      } catch {
        return { id: r.id, name: 'Untitled', description: '', items: [] }
      }
    })
  } catch {
    collections = []
  }

  let mediaOptions: { username: string; title: string | null }[] = []
  try {
    mediaOptions = await prisma.userMedia.findMany({
      where: { userId },
      select: { username: true, title: true },
    })
  } catch {
    /* */
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard" className="text-xs text-[#8b1a1a] hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1 text-[#2d0808]">My collections</h1>
      <p className="text-sm text-[#6b5555] mb-6">
        Group related channels for promotion and directory features.
      </p>

      <CollectionsClient initial={collections} mediaOptions={mediaOptions} />
    </div>
  )
}
