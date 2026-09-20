import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardMediaForm from '@/components/DashboardMediaForm'
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
  }[] = []
  try {
    media = await prisma.userMedia.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    /* */
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard" className="text-xs text-violet-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Media list</h1>
      <p className="text-sm text-slate-500 mb-6">Channels and groups you manage.</p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <h2 className="font-semibold mb-3">Add media</h2>
        <DashboardMediaForm />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        {media.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No media yet.</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {media.map((m) => (
              <li key={m.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{m.title || `@${m.username}`}</p>
                  <p className="text-xs text-slate-400">
                    @{m.username} · {m.type} · {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    m.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : m.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
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
