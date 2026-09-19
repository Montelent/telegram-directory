import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MySubmissionsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    redirect('/login')
  }

  const userId = (session.user as any).id as string

  const submissions = await prisma.submission.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Link href="/account" className="text-sm text-blue-600 hover:underline">← Account</Link>
        <h1 className="text-2xl font-bold mt-2 mb-6">My Submissions</h1>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
            You haven't submitted anything yet.
            <div className="mt-4">
              <Link href="/submit" className="text-blue-600 hover:underline">Submit a group →</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">@{s.username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    s.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>{s.status}</span>
                </div>
                {s.title && <p className="text-sm text-slate-600 mt-1">{s.title}</p>}
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(s.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
