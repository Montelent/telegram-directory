import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardMediaPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') redirect('/login')

  const userId = (session.user as any).id as string

  let media: {
    id: string
    username: string
    title: string | null
    type: string
    status: string
    createdAt: Date
    entityId: string | null
  }[] = []

  try {
    media = await prisma.userMedia.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Sync status from live entity (if admin approved but user_media wasn't updated)
    for (const m of media) {
      if (m.status === 'PENDING' || m.status === 'REJECTED') {
        try {
          const entity = await prisma.entity.findFirst({
            where: {
              username: { equals: m.username, mode: 'insensitive' },
              status: 'APPROVED',
            },
          })
          if (entity) {
            await prisma.userMedia.update({
              where: { id: m.id },
              data: { status: 'APPROVED', entityId: entity.id, title: m.title || entity.title },
            })
            m.status = 'APPROVED'
            m.entityId = entity.id
          }
        } catch {
          /* */
        }
      }
    }
  } catch {
    media = []
  }

  // Also include submissions by this user not yet in user_media
  let submissions: { id: string; username: string; title: string | null; type: string; status: string; createdAt: Date }[] = []
  try {
    submissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    /* */
  }

  const usernames = new Set(media.map((m) => m.username.toLowerCase()))
  for (const s of submissions) {
    if (!usernames.has(s.username.toLowerCase())) {
      media.push({
        id: s.id,
        username: s.username,
        title: s.title,
        type: s.type,
        status: s.status,
        createdAt: s.createdAt,
        entityId: null,
      })
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard" className="text-xs text-[#8b1a1a] hover:underline">
        ← Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2d0808]">Media list</h1>
          <p className="text-sm text-[#6b5555]">Channels and groups you manage.</p>
        </div>
        <Link
          href="/submit"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#8b1a1a] to-[#4a0e0e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          + Add media
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#f0e0e0] shadow-sm overflow-hidden">
        {media.length === 0 ? (
          <div className="py-12 text-center px-4">
            <p className="text-3xl mb-2 opacity-40">📁</p>
            <p className="text-sm text-[#6b5555] mb-4">No media yet</p>
            <Link
              href="/submit"
              className="inline-flex rounded-xl bg-[#1a2332] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Add your first channel
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#f5f0f0]">
            {media.map((m) => (
              <li key={m.id} className="px-4 py-4 flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2d0808] truncate">
                    {m.title || `@${m.username}`}
                  </p>
                  <p className="text-xs text-[#6b5555]">
                    @{m.username} · {m.type} · {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                  {m.status === 'APPROVED' && m.entityId && (
                    <Link
                      href={`/entity/${m.entityId}`}
                      className="text-xs text-[#8b1a1a] hover:underline"
                    >
                      View public page →
                    </Link>
                  )}
                </div>
                <span
                  className={`shrink-0 text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${
                    m.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : m.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
