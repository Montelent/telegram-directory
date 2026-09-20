import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function BlogIndexPage() {
  let posts: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    coverImage: string | null
    publishedAt: Date | null
    category: { name: string; slug: string } | null
  }[] = []

  try {
    posts = await prisma.blogPost.findMany({
      where: { published: true },
      include: { category: true },
      orderBy: { publishedAt: 'desc' },
      take: 24,
    })
  } catch {
    /* tables may not exist */
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Blog</h1>
        <p className="text-slate-500 mb-8 text-sm">News and guides about Telegram communities.</p>

        {posts.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center text-slate-500">
            No posts published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-xl border overflow-hidden hover:border-blue-300 hover:shadow-sm transition"
              >
                {post.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImage} alt="" className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  {post.category && (
                    <span className="text-xs text-blue-600">{post.category.name}</span>
                  )}
                  <h2 className="font-semibold text-lg mt-1 text-slate-900">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-3">{post.excerpt}</p>
                  )}
                  {post.publishedAt && (
                    <p className="text-xs text-slate-400 mt-3">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
