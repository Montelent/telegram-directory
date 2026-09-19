import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <Link href="/account" className="text-sm text-blue-600 hover:underline">← Account</Link>
        <h1 className="text-2xl font-bold mt-2 mb-6">Settings</h1>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-slate-600">
            Profile editing and password change will be available in a future update.
          </p>
          <p className="text-sm text-slate-500 mt-4">
            Logged in as <strong>{session.user?.email}</strong>
          </p>
        </div>
      </div>
    </main>
  )
}
