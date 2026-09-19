export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Telegram Directory
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Discover public Telegram groups and channels. Search by topic, browse categories, and submit your own.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="/search"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition"
            >
              Search Groups & Channels
            </a>
            <a
              href="/submit"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Submit a Group
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-xl border bg-white shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">Browse by Category</h3>
              <p className="text-sm text-slate-600">Crypto, News, Tech, Gaming, Local communities and more.</p>
            </div>
            <div className="p-6 rounded-xl border bg-white shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">Verified & Updated</h3>
              <p className="text-sm text-slate-600">Member counts and status refreshed regularly.</p>
            </div>
            <div className="p-6 rounded-xl border bg-white shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-2">Admin Powered</h3>
              <p className="text-sm text-slate-600">Full moderation and API management tools for operators.</p>
            </div>
          </div>

          <p className="mt-12 text-sm text-slate-500">
            Admin panel → <a href="/admin" className="text-blue-600 hover:underline">/admin</a>
          </p>
        </div>
      </div>
    </main>
  )
}
