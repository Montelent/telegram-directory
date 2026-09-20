import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DashboardMediaForm from '@/components/DashboardMediaForm'

export const dynamic = 'force-dynamic'

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    redirect('/login?callbackUrl=/dashboard')
  }

  const userId = (session.user as any).id as string

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/login')

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
    /* table may not exist yet */
  }

  const balance = (user.balanceCents ?? 0) / 100

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back{user.name ? `, ${user.name}` : ''}
            </h1>
            <p className="text-sm text-slate-500">Your media and balance in one place.</p>
          </div>
          <Link href="/account" className="text-sm text-blue-600 hover:underline">
            Account settings
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4 sm:p-5">
            <p className="text-xs text-slate-500">BALANCE</p>
            <p className="text-2xl font-bold mt-1">${balance.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4 sm:p-5">
            <p className="text-xs text-slate-500">MEDIA</p>
            <p className="text-2xl font-bold mt-1">{media.length}</p>
          </div>
          <div className="bg-white rounded-xl border p-4 sm:p-5 col-span-2 lg:col-span-1">
            <p className="text-xs text-slate-500">PENDING</p>
            <p className="text-2xl font-bold mt-1 text-yellow-600">
              {media.filter((m) => m.status === 'PENDING').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 mb-6">
          <h2 className="font-semibold mb-3">Add media</h2>
          <p className="text-xs text-slate-500 mb-3">
            Submit a channel or group username for review. After approval it can appear in the directory.
          </p>
          <DashboardMediaForm />
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Media list</h2>
          </div>
          {media.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No media yet. Add a channel above.</p>
          ) : (
            <ul className="divide-y">
              {media.map((m) => (
                <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">
                      {m.title || `@${m.username}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{m.username} · {m.type}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      m.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : m.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
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
    </main>
  )
}
