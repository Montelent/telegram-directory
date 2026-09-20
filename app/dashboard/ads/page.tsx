import Link from 'next/link'

export default function DashboardAdsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard" className="text-xs text-violet-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Advertising</h1>
      <p className="text-sm text-slate-500 mb-6">Promote your channels across the directory.</p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <p className="text-3xl mb-2 opacity-40">📣</p>
        <p className="text-sm text-slate-500 mb-2">No active campaigns</p>
        <p className="text-xs text-slate-400 mb-4">
          Top up your balance, then launch ads when the campaign builder is enabled.
        </p>
        <Link
          href="/dashboard/deposit"
          className="inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          Top up balance
        </Link>
      </div>
    </div>
  )
}
