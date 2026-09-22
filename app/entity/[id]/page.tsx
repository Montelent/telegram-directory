import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ReviewSection from '@/components/ReviewSection'
import ReportMenu from '@/components/ReportMenu'
import RankShareActions from '@/components/RankShareActions'
import { AdSlot } from '@/components/SiteScripts'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const entity = await prisma.entity.findUnique({ where: { id } })
  if (!entity || entity.status !== 'APPROVED') return {}

  const title = entity.seoTitle || entity.title
  const description = entity.seoDescription || entity.shortDesc || entity.description || undefined
  const robotsStr = entity.robots || 'index,follow'

  return {
    title,
    description,
    alternates: entity.canonicalUrl ? { canonical: entity.canonicalUrl } : undefined,
    robots: {
      index: !robotsStr.includes('noindex'),
      follow: !robotsStr.includes('nofollow'),
    },
    openGraph: {
      title,
      description,
      images: entity.ogImage || entity.photoUrl ? [entity.ogImage || entity.photoUrl!] : undefined,
    },
  }
}

function formatCount(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  return n.toLocaleString()
}

function formatFull(n: number | null | undefined) {
  if (n == null) return '—'
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

  let globalRank: number | null = null
  let categoryRank: number | null = null
  let languageRank: number | null = null
  let totalApproved = 0

  try {
    totalApproved = await prisma.entity.count({ where: { status: 'APPROVED' } })
    if (entity.memberCount != null) {
      globalRank =
        (await prisma.entity.count({
          where: {
            status: 'APPROVED',
            OR: [
              { memberCount: { gt: entity.memberCount } },
              { memberCount: entity.memberCount, title: { lt: entity.title } },
            ],
          },
        })) + 1
    }
    if (entity.categoryId && entity.memberCount != null) {
      categoryRank =
        (await prisma.entity.count({
          where: {
            status: 'APPROVED',
            categoryId: entity.categoryId,
            memberCount: { gt: entity.memberCount },
          },
        })) + 1
    }
    if (entity.language && entity.memberCount != null) {
      languageRank =
        (await prisma.entity.count({
          where: {
            status: 'APPROVED',
            language: entity.language,
            memberCount: { gt: entity.memberCount },
          },
        })) + 1
    }
  } catch {
    /* */
  }

  let related: typeof entity[] = []
  try {
    related = await prisma.entity.findMany({
      where: {
        status: 'APPROVED',
        id: { not: entity.id },
        OR: [
          entity.categoryId ? { categoryId: entity.categoryId } : {},
          entity.language ? { language: entity.language } : {},
        ].filter((x) => Object.keys(x).length > 0),
      },
      include: { category: true },
      orderBy: { memberCount: 'desc' },
      take: 8,
    })
    if (related.length < 4) {
      const more = await prisma.entity.findMany({
        where: {
          status: 'APPROVED',
          id: { not: entity.id, notIn: related.map((r) => r.id) },
        },
        include: { category: true },
        orderBy: { memberCount: 'desc' },
        take: 8 - related.length,
      })
      related = [...related, ...more]
    }
  } catch {
    related = []
  }

  const telegramUrl = entity.username
    ? 'https://t.me/' + entity.username
    : entity.inviteLink || '#'

  const typeLabel = entity.type === 'CHANNEL' ? 'CHANNEL' : 'GROUP'
  const shortDesc = entity.shortDesc || entity.description
  const longDesc = entity.longDesc || entity.description
  const tags = (entity.tags || '')
    .split(/[,#\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8)

  // Admin-controlled JSON-LD (set via Admin → Groups & Channels → Edit → SEO panel).
  // Falls back to a minimal WebPage object for entities saved before this existed.
  const jsonLd =
    entity.seoJsonLd ||
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: entity.title,
      description: shortDesc || undefined,
      url: telegramUrl,
    })

  return (
    <main className="min-h-screen bg-[#eef1f6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="container mx-auto px-3 sm:px-4 py-5 max-w-2xl">
        <nav
          className="text-[11px] text-slate-500 mb-3 flex flex-wrap items-center gap-1"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-[#0088cc]">
            Home
          </Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-[#0088cc]">
            Channels
          </Link>
          {entity.category && (
            <>
              <span>/</span>
              <Link href={'/category/' + entity.category.slug} className="hover:text-[#0088cc]">
                {entity.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-700 truncate max-w-[12rem]">{entity.title}</span>
        </nav>

        <AdSlot slot="header" />

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 pt-4 flex items-center justify-between gap-3">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-semibold px-5 py-2.5 shadow-sm"
            >
              View Channel
            </a>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <p className="font-bold text-slate-800 text-sm">{formatCount(entity.memberCount)}</p>
                <p className="text-[10px] text-slate-400">subs</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-slate-800 text-sm">
                  {avgRating != null ? avgRating.toFixed(2) : '—'}
                </p>
                <p className="text-[10px] text-slate-400">rating</p>
              </div>
              <ReportMenu entityId={entity.id} title={entity.title} />
            </div>
          </div>

          <div className="px-4 sm:px-5 pt-5 pb-3 flex gap-4">
            {entity.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entity.photoUrl}
                alt=""
                className="w-[72px] h-[72px] rounded-2xl object-cover border border-slate-100 shrink-0"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {(entity.title || '?')[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {typeLabel}
                </span>
                {entity.isVerified && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                )}
                {entity.isFeatured && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    Featured
                  </span>
                )}
                {entity.isNsfw && (
                  <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                    NSFW
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{entity.title}</h1>
              {entity.username && (
                <p className="text-[#0088cc] text-sm font-medium">@{entity.username}</p>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-1.5">
            {entity.category && (
              <Link
                href={'/category/' + entity.category.slug}
                className="text-[11px] rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 hover:bg-slate-200"
              >
                {entity.category.name}
              </Link>
            )}
            {entity.language && (
              <span className="text-[11px] rounded-full bg-slate-100 text-slate-600 px-2.5 py-1">
                {entity.language}
              </span>
            )}
            {entity.country && (
              <span className="text-[11px] rounded-full bg-slate-100 text-slate-600 px-2.5 py-1">
                {entity.country}
              </span>
            )}
            {tags.map((t) => (
              <span key={t} className="text-[11px] rounded-full bg-blue-50 text-blue-700 px-2.5 py-1">
                #{t}
              </span>
            ))}
          </div>

          {(shortDesc || longDesc) && (
            <div className="mx-4 sm:mx-5 mb-4 rounded-xl bg-[#f7f8fa] border border-slate-100 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {shortDesc || longDesc}
              </p>
            </div>
          )}

          <div className="mx-4 sm:mx-5 mb-4 rounded-2xl border border-slate-100 px-4 py-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">Rankings</p>
            <div className="grid grid-cols-2 gap-3">
              <RankCard
                label="Global Rank"
                value={globalRank != null ? '#' + globalRank.toLocaleString() : '—'}
                sub={totalApproved ? 'of ' + totalApproved.toLocaleString() : undefined}
              />
              <RankCard
                label="Language Rank"
                value={languageRank != null ? '#' + languageRank.toLocaleString() : '—'}
                sub={entity.language || undefined}
              />
              <RankCard
                label="Category Rank"
                value={categoryRank != null ? '#' + categoryRank.toLocaleString() : '—'}
                sub={entity.category?.name}
              />
              <RankCard label="Members" value={formatFull(entity.memberCount)} sub="subscribers" />
            </div>
            <RankShareActions
              entityId={entity.id}
              title={entity.title}
              username={entity.username}
              memberCount={entity.memberCount}
              type={entity.type}
              globalRank={globalRank}
            />
          </div>

          <div className="mx-4 sm:mx-5 mb-4 rounded-xl border border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Subscribers</p>
              <p className="text-sm font-bold text-slate-800">{formatFull(entity.memberCount)}</p>
            </div>
            <div className="h-14 flex items-end gap-0.5 opacity-60">
              {Array.from({ length: 24 }).map((_, i) => {
                const barH = 20 + ((i * 17 + (entity.memberCount || 10)) % 40)
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-[#0088cc]/40 to-[#0088cc]"
                    style={{ height: barH + '%' }}
                  />
                )
              })}
            </div>
          </div>

          <div className="mx-4 sm:mx-5 mb-4 rounded-xl border border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Rate</p>
              <p className="text-sm font-semibold text-slate-800">
                {avgRating != null ? (
                  <>
                    <span className="text-amber-400">★</span> {avgRating.toFixed(2)}{' '}
                    <span className="text-slate-400 font-normal text-xs">({reviews.length})</span>
                  </>
                ) : (
                  'No ratings yet'
                )}
              </p>
            </div>
            <div className="text-amber-400 text-lg tracking-tight">★★★★★</div>
          </div>

          <div className="px-4 sm:px-5 pb-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">About</p>
            <div className="text-sm text-slate-600 leading-relaxed space-y-2">
              {longDesc ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: /<[a-z][\s\S]*>/i.test(longDesc)
                      ? longDesc
                      : longDesc.replace(/\n/g, '<br/>'),
                  }}
                />
              ) : shortDesc ? (
                <p>{shortDesc}</p>
              ) : (
                <p className="text-slate-400">No long description yet.</p>
              )}
            </div>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full inline-flex items-center justify-center rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold py-3.5 text-sm"
            >
              Open in Telegram
            </a>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-[11px] text-amber-900">
          <strong>Attention:</strong> Do your own research before trusting content or sending money.
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <h2 className="font-bold text-slate-900 mb-3">Comments</h2>
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

        {related.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <h2 className="font-bold text-slate-900 mb-3">Telegram channels you may like</h2>
            <ul className="space-y-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={'/entity/' + r.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:border-[#0088cc]/30 hover:bg-slate-50 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                      {(r.title || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {r.username ? '@' + r.username : r.type}
                        {r.category ? ' · ' + r.category.name : ''}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 shrink-0">
                      {formatCount(r.memberCount)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <AdSlot slot="in_content" />
      </div>
    </main>
  )
}

function RankCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl bg-[#f7f8fa] border border-slate-100 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}
