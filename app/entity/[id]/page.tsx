import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ReviewSection from '@/components/ReviewSection'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EntityByIdPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!entity) notFound()

  // Public only sees APPROVED
  if (entity.status !== 'APPROVED') {
    const role = (session?.user as any)?.role
    if (role !== 'admin') notFound()
  }

  let reviews: {
    id: string
    rating: number
    comment: string | null
    createdAt: Date
    user: { name: string | null; email: string }
  }[] = []

  try {
    reviews = await prisma.review.findMany({
      where: { entityId: entity.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  } catch {
    /* table may not exist */
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
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
          <div className="flex flex-col sm:flex-row gap-4">
            {entity.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entity.photoUrl}
                alt={entity.title}
                className="w-20 h-20 rounded-full object-cover border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                {entity.type === 'CHANNEL' ? '📢' : '👥'}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{entity.title}</h1>
                {entity.isVerified && <span className="text-blue-500 text-sm">✓ Verified</span>}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    entity.type === 'CHANNEL'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {entity.type}
                </span>
                {entity.status !== 'APPROVED' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                    {entity.status}
                  </span>
                )}
              </div>
              {entity.username && <p className="text-blue-600 mt-1">@{entity.username}</p>}
              {entity.description && (
                <p className="text-slate-600 mt-3 whitespace-pre-line">{entity.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                {entity.category && (
                  <Link href={`/category/${entity.category.slug}`} className="hover:text-blue-600">
                    {entity.category.name}
                  </Link>
                )}
                {entity.memberCount != null && (
                  <span>{entity.memberCount.toLocaleString()} members</span>
                )}
                {avgRating != null && (
                  <span>
                    ★ {avgRating.toFixed(1)} ({reviews.length})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-[#0088cc] px-8 py-3.5 text-white font-semibold hover:bg-[#0077b5] transition text-lg"
            >
              Open in Telegram
            </a>
          </div>
        </div>

        <ReviewSection
          entityId={entity.id}
          reviews={reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
            user: { name: r.user.name, email: r.user.email },
          }))}
          isLoggedIn={!!session && (session.user as any)?.role === 'user'}
          avgRating={avgRating}
        />
      </div>
    </main>
  )
}
