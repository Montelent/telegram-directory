export default function UserApiPage() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900 mb-2">API</h1>
      <p className="text-sm text-slate-500 mb-4">
        Personal API access for your listings (coming soon). Site-wide integrations are managed by admins.
      </p>
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-600 font-mono">
        API keys are not enabled for user accounts yet.
      </div>
    </div>
  )
}
