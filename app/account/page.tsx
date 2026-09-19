import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Account</h1>
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-500">Name</p>
            <p className="font-medium">{session.user?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="font-medium">{session.user?.email}</p>
          </div>
          <div className="pt-4 border-t flex flex-col gap-2">
            <Link href="/account/submissions" className="text-blue-600 hover:underline text-sm">
              My Submissions →
            </Link>
            <Link href="/account/settings" className="text-blue-600 hover:underline text-sm">
              Settings →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
