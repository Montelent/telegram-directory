import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Allow login page without session
  // (middleware already protects most routes, this is extra safety)

  return (
    <div className="min-h-screen bg-slate-50">
      {session && (
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="text-xl font-bold text-slate-900">
                Admin
              </Link>
              <nav className="flex gap-4 text-sm">
                <Link href="/admin" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
                <Link href="/admin/entities" className="text-slate-600 hover:text-slate-900">Groups & Channels</Link>
                <Link href="/admin/categories" className="text-slate-600 hover:text-slate-900">Categories</Link>
                <Link href="/admin/submissions" className="text-slate-600 hover:text-slate-900">Submissions</Link>
                <Link href="/admin/integrations" className="text-slate-600 hover:text-slate-900">API Integrations</Link>
              </nav>
            </div>
            <div className="text-sm text-slate-500">
              {session.user?.email}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
