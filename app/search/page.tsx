export default function SearchPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Search Telegram Groups & Channels</h1>

        <div className="max-w-2xl">
          <form className="flex gap-2 mb-8">
            <input
              type="search"
              name="q"
              placeholder="Search by name, keyword, or @username..."
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <p className="text-slate-500 text-sm">
            Search functionality will be connected to the database soon. For now this is a placeholder UI.
          </p>
        </div>
      </div>
    </main>
  )
}
