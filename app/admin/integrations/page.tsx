export default function AdminIntegrationsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <a href="/admin" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</a>
          <h1 className="text-xl font-bold mt-1">API Integrations</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold">Supported Integrations</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">TGStat API</p>
                <p className="text-slate-500">Enrich with stats, categories, and discovery</p>
              </div>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">Coming soon</span>
            </li>
            <li className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Custom Crawler (Telethon)</p>
                <p className="text-slate-500">Background discovery of new public groups</p>
              </div>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">Future</span>
            </li>
          </ul>
          <p className="text-slate-500 text-sm pt-2">
            You will be able to store API tokens securely here and trigger sync jobs from the admin panel.
          </p>
        </div>
      </div>
    </div>
  )
}
