import Link from 'next/link'

export default function DashboardCollectionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href="/dashboard" className="text-xs text-violet-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">My collections</h1>
      <p className="text-sm text-slate-500 mb-6">
        Group related channels for promotion and directory features.
      </p>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <p className="text-3xl mb-2 opacity-40">🗂</p>
        <p className="text-sm text-slate-500 mb-4">No collections yet</p>
        <button
          type="button"
          disabled
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
        >
          Coming soon
        </button>
      </div>
    </div>
  )
}
