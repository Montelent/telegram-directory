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
    isFeatured?: boolean
  }[] = []

  try {
    media = await prisma.userMedia.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

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
              data: {
                status: 'APPROVED',
                entityId: entity.id,
                title: m.title || entity.title,
              },
            })
            m.status = 'APPROVED'
            m.entityId = entity.id
            m.isFeatured = entity.isFeatured
          }
        } catch {
          /* */
        }
      } else if (m.entityId) {
        try {
          const entity = await prisma.entity.findUnique({ where: { id: m.entityId } })
          if (entity) m.isFeatured = entity.isFeatured
        } catch {
          /* */
        }
      }
    }
  } catch {
    media = []
  }

  try {
    const submissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
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
  } catch {
    /* */
  }

  const total = media.length
  const pending = media.filter((m) => m.status === 'PENDING').length
  const featured = media.filter((m) => m.isFeatured).length

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span>🔗</span> Media
        </span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Media list</h1>
      <p className="text-sm text-slate-500 mb-4">
        Manage your submitted channels, groups, bots and stickers.
      </p>

      <Link
        href="/submit"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a2332] hover:bg-[#0f1620] text-white font-semibold py-3.5 text-sm shadow-sm mb-4"
      >
        <span className="text-lg leading-none">+</span> Add New Media
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <div className="w-9 h-9 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-1">
            📢
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total media</p>
          <p className="text-xl font-bold text-slate-900">{total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <div className="w-9 h-9 mx-auto rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 mb-1">
            ⏱
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pending</p>
          <p className="text-xl font-bold text-sky-600">{pending}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
          <div className="w-9 h-9 mx-auto rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 mb-1">
            ♛
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Featured</p>
          <p className="text-xl font-bold text-amber-600">{featured}</p>
        </div>
      </div>

      {/* List / empty */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[220px]">
        {media.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-2xl text-slate-400 mb-3">
              📢
            </div>
            <p className="text-sm font-medium text-slate-700 mb-4">There are no media submitted!</p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a2332] text-white text-sm font-semibold px-5 py-2.5"
            >
              <span>+</span> Add New Media
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {media.map((m) => (
              <li key={m.id} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg shrink-0">
                  {m.type === 'CHANNEL' ? '📢' : '👥'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {m.title || `@${m.username}`}
                  </p>
                  <p className="text-xs text-slate-400">
                    @{m.username} · {m.type}
                    {m.isFeatured ? ' · Featured' : ''}
                  </p>
                  {m.status === 'APPROVED' && m.entityId && (
                    <Link
                      href={`/entity/${m.entityId}`}
                      className="text-[11px] text-[#0088cc] hover:underline"
                    >
                      View listing →
                    </Link>
                  )}
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    m.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : m.status === 'PENDING'
                        ? 'bg-sky-50 text-sky-700'
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
