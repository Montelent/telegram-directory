import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [totalEntities, pendingSubmissions, totalCategories, approvedEntities] =
    await Promise.all([
      prisma.entity.count(),
      prisma.submission.count({ where: { status: 'PENDING' } }),
      prisma.category.count(),
      prisma.entity.count({ where: { status: 'APPROVED' } }),
    ])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl border shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500">Total Entities</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{totalEntities}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500">Pending</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 text-yellow-600">{pendingSubmissions}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500">Approved</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 text-green-600">{approvedEntities}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500">Categories</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{totalCategories}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border p-4 sm:p-6">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/admin/submissions"
              className="block w-full text-left px-4 py-3 rounded-lg bg-yellow-50 text-yellow-800 hover:bg-yellow-100 transition text-sm font-medium"
            >
              Review Submissions ({pendingSubmissions} pending)
            </Link>
            <Link
              href="/admin/entities"
              className="block w-full text-left px-4 py-3 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition text-sm font-medium"
            >
              Manage Groups & Channels
            </Link>
            <Link
              href="/admin/categories"
              className="block w-full text-left px-4 py-3 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition text-sm font-medium"
            >
              Manage Categories
            </Link>
            <Link
              href="/admin/integrations"
              className="block w-full text-left px-4 py-3 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition text-sm font-medium"
            >
              API Integrations
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 sm:p-6">
          <h3 className="font-semibold mb-3">Getting Started</h3>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
            <li>Submit test groups via the public form</li>
            <li>Approve them under Submissions</li>
            <li>Manage categories and entities</li>
            <li>TGStat free tier is limited — use it for testing only</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
