export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Telegram Directory – Admin</h1>
          <nav className="flex gap-4 text-sm">
            <a href="/admin" className="text-blue-600 font-medium">Dashboard</a>
            <a href="/admin/entities" className="text-slate-600 hover:text-slate-900">Groups & Channels</a>
            <a href="/admin/categories" className="text-slate-600 hover:text-slate-900">Categories</a>
            <a href="/admin/submissions" className="text-slate-600 hover:text-slate-900">Submissions</a>
            <a href="/admin/integrations" className="text-slate-600 hover:text-slate-900">API Integrations</a>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm text-slate-500">Total Entities</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm text-slate-500">Pending Submissions</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm text-slate-500">Categories</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm text-slate-500">Active Integrations</p>
            <p className="text-3xl font-bold mt-1">—</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-2">Getting Started</h3>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
            <li>Set up your database and run <code className="bg-slate-100 px-1 rounded">npx prisma db push</code></li>
            <li>Configure admin credentials in <code className="bg-slate-100 px-1 rounded">.env</code></li>
            <li>Add categories and start approving submissions</li>
            <li>Later: connect TGStat or your own crawler under API Integrations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
