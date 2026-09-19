export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <h1 className="text-3xl font-bold mb-2">Submit a Group or Channel</h1>
        <p className="text-slate-600 mb-8">
          Suggest a public Telegram group or channel. All submissions are reviewed by admins before appearing in the directory.
        </p>

        <form className="space-y-5 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username or Invite Link *</label>
            <input
              type="text"
              name="username"
              placeholder="@example or https://t.me/example"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
            <select
              name="type"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="GROUP">Group</option>
              <option value="CHANNEL">Channel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title (optional)</label>
            <input
              type="text"
              name="title"
              placeholder="Display name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Short Description (optional)</label>
            <textarea
              name="description"
              rows={3}
              placeholder="What is this group/channel about?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700"
          >
            Submit for Review
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500">
          Note: Form submission is not yet wired to the backend. Coming in the next iteration.
        </p>
      </div>
    </main>
  )
}
