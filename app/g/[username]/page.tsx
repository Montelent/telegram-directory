import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ReviewSection from '@/components/ReviewSection'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

export default async function EntityDetailPage({ params }: Props) {
  const { username } = await params
  const session = await getServerSession(authOptions)

  const entity = await prisma.entity.findFirst({
    where: {
      username: username.toLowerCase().replace(/^@/, ''),
      status: 'APPROVED',
    },
    include: {
      category: true,
      reviews: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!entity) notFound()

  const avgRating =
    entity.reviews.length > 0
      ? entity.reviews.reduce((s, r) => s + r.rating, 0) / entity.reviews.length
      : null

  const telegramUrl = entity.username
    ? `https://t.me/${entity.username}`
    : entity.inviteLink || '#'

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/search" className="text-sm text-blue-600 hover:underline">
          ← Back to search
        </Link>

        <div className="bg-white rounded-xl border p-6 mt-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{entity.title}</h1>
                {entity.isVerified && (
                  <span className="text-blue-500 text-sm">✓ Verified</span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    entity.type === 'CHANNEL'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {entity.type}
                </span>
              </div>
              {entity.username && (
                <p className="text-blue-600 mt-1">@{entity.username}</p>
              )}
              {entity.description && (
                <p className="text-slate-600 mt-3">{entity.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                {entity.category && (
                  <Link
                    href={`/category/${entity.category.slug}`}
                    className="hover:text-blue-600"
                  >
                    {entity.category.name}
                  </Link>
                )}
                {entity.memberCount != null && (
                  <span>{entity.memberCount.toLocaleString()} members</span>
                )}
                {avgRating != null && (
                  <span>
                    ★ {avgRating.toFixed(1)} ({entity.reviews.length} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Primary CTA: Open in Telegram first */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0088cc] px-6 py-3 text-white font-semibold hover:bg-[#0077b5] transition text-center"
            >
              Open in Telegram
            </a>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-slate-700 font-medium hover:bg-slate-50 transition text-center"
            >
              Browse more
            </Link>
          </div>
        </div>

        <ReviewSection
          entityId={entity.id}
          reviews={entity.reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
            user: {
              name: r.user.name,
              email: r.user.email,
            },
          }))}
          isLoggedIn={!!session && (session.user as any)?.role === 'user'}
          avgRating={avgRating}
        />
      </div>
    </main>
  )
}
