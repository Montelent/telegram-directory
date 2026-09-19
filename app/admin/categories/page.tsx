export default function AdminCategoriesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <a href="/admin" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</a>
          <h1 className="text-xl font-bold mt-1">Manage Categories</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <p className="text-slate-600">
          Category CRUD will live here. Default categories are seeded via <code>prisma/seed.ts</code>.
        </p>
      </div>
    </div>
  )
}
