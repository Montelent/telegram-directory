import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ReviewSection from '@/components/ReviewSection'
import { AdSlot } from '@/components/SiteScripts'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

function formatCount(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  return n.toLocaleString()
}

export default async function EntityByIdPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!entity) notFound()
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
    /* */
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null

  const telegramUrl = entity.username
    ? `https://t.me/${entity.username}`
    : entity.inviteLink || '#'

  const typeLabel = entity.type === 'CHANNEL' ? 'CHANNEL' : 'GROUP'

  // Optional JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': entity.type === 'CHANNEL' ? 'BroadcastChannel' : 'SocialMediaPosting',
    name: entity.title,
    description: entity.description || undefined,
    url: telegramUrl,
    identifier: entity.username ? `@${entity.username}` : entity.id,
  }

  return (
    <main className="min-h-screen bg-[#f4f5f7]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <nav className="text-xs text-slate-500 mb-4 flex flex-wrap gap-1">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-blue-600">Channels</Link>
          {entity.category && (
            <>
              <span>/</span>
              <Link href={`/category/${entity.category.slug}`} className="hover:text-blue-600">
                {entity.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-700">{entity.title}</span>
        </nav>

        <AdSlot slot="header" />

        {/* Main card – telegramchannels.me style */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top bar: type + View Channel */}
          <div className="px-5 sm:px-8 pt-6 pb-4 flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex gap-4 flex-1 min-w-0">
              {entity.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entity.photoUrl}
                  alt={entity.title}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-100 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center text-3xl shrink-0">
                  {entity.type === 'CHANNEL' ? '📢' : '👥'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {typeLabel}
                  </span>
                  {entity.isVerified && (
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      ✓ Verified
                    </span>
                  )}
                  {entity.isScam && (
                    <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      Scam flag
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {entity.title}
                </h1>
                {entity.username && (
                  <p className="text-[#0088cc] font-medium mt-0.5">@{entity.username}</p>
                )}
                {entity.language && (
                  <p className="text-xs text-slate-400 mt-1">Language: {entity.language}</p>
                )}
              </div>
            </div>

            <div className="sm:text-right shrink-0 flex flex-col gap-2">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[#0088cc] hover:bg-[#0077b5] px-6 py-3 text-white font-semibold text-sm shadow-sm transition"
              >
                View Channel
              </a>
              {entity.username && (
                <p className="text-[11px] text-slate-400 text-center sm:text-right">
                  Can&apos;t join?{' '}
                  <a href={telegramUrl} className="text-[#0088cc] hover:underline">
                    @{entity.username}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Attention box */}
          <div className="mx-5 sm:mx-8 mb-5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-900">
            <strong>Attention:</strong> Please conduct your own research before trusting the content.
            Especially if they asked you for money.
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 border-y border-slate-100">
            <div className="bg-white px-4 py-4 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Subscribers</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCount(entity.memberCount)}
              </p>
            </div>
            <div className="bg-white px-4 py-4 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Rating</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {avgRating != null ? (
                  <>
                    <span className="text-amber-400">★</span> {avgRating.toFixed(1)}
                  </>
                ) : (
                  '—'
                )}
              </p>
              <p className="text-[10px] text-slate-400">{reviews.length} reviews</p>
            </div>
            <div className="bg-white px-4 py-4 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Type</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{typeLabel}</p>
            </div>
            <div className="bg-white px-4 py-4 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Updated</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {entity.lastCheckedAt
                  ? new Date(entity.lastCheckedAt).toLocaleDateString()
                  : new Date(entity.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Rank-style cards */}
          <div className="grid sm:grid-cols-3 gap-3 p-5 sm:p-6">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Category</p>
              <p className="font-semibold text-slate-900 mt-1">
                {entity.category ? (
                  <Link href={`/category/${entity.category.slug}`} className="hover:text-blue-600">
                    {entity.category.name}
                  </Link>
                ) : (
                  'Uncategorized'
                )}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Source</p>
              <p className="font-semibold text-slate-900 mt-1 capitalize">
                {entity.source || 'directory'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Country</p>
              <p className="font-semibold text-slate-900 mt-1">
                {entity.country || '—'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="px-5 sm:px-8 pb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">#{entity.title}</h2>
            {entity.description ? (
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {entity.description}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No description available.</p>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[#0088cc] hover:bg-[#0077b5] px-8 py-3.5 text-white font-semibold transition"
              >
                Open in Telegram
              </a>
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Browse more channels
              </Link>
            </div>
          </div>
        </div>

        {/* Rate prompt */}
        <div className="mt-4 bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-700 font-medium">Do you like this channel?</p>
          <div className="flex items-center gap-2 text-amber-400 text-xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n}>★</span>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            {(session as any)?.user?.role === 'user' ? (
              'Leave a review below'
            ) : (
              <>
                <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
                {' '}to rate this channel
              </>
            )}
          </p>
        </div>

        <div className="mt-6">
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

        <AdSlot slot="in_content" />
      </div>
    </main>
  )
}
