import Link from 'next/link'
import ReviewSection from '@/components/ReviewSection'
import ReportMenu from '@/components/ReportMenu'
import RankShareActions from '@/components/RankShareActions'
import { AdSlot } from '@/components/SiteScripts'
import { loadEntityExtras } from '@/lib/load-entity-page'
import { entityPath } from '@/lib/entity-path'

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

export default async function EntityDetailView({
  entity,
  session,
}: {
  entity: any
  session: any
}) {
  const {
    reviews,
    avgRating,
    globalRank,
    categoryRank,
    languageRank,
    totalApproved,
    related,
  } = await loadEntityExtras(entity.id, entity)

  const telegramUrl = entity.username
    ? 'https://t.me/' + entity.username
    : entity.inviteLink || '#'

  const typeLabel =
    entity.type === 'GROUP'
      ? 'GROUP'
      : (entity.username || '').toLowerCase().endsWith('bot')
        ? 'BOT'
        : 'CHANNEL'

  const shortDesc = entity.shortDesc || entity.description
  const longDesc = entity.longDesc || entity.description
  const tags = (entity.tags || '')
    .split(/[,#\s]+/)
    .map((t: string) => t.trim())
    .filter(Boolean)
    .slice(0, 8)

  const jsonLd =
    entity.seoJsonLd ||
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: entity.title,
      description: shortDesc || undefined,
      url: entityPath(entity),
    })

  return (
    <main className="min-h-screen bg-[#eef1f6] overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div className="container mx-auto px-3 sm:px-4 py-5 max-w-2xl min-w-0">
        <nav
          className="text-[11px] text-slate-500 mb-3 flex flex-wrap items-center gap-1"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-[#0088cc]">
            Home
          </Link>
          <span>/</span>
          <Link
            href={
              typeLabel === 'BOT' ? '/bots' : typeLabel === 'GROUP' ? '/groups' : '/channels'
            }
            className="hover:text-[#0088cc]"
          >
            {typeLabel === 'BOT' ? 'Bots' : typeLabel === 'GROUP' ? 'Groups' : 'Channels'}
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

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden min-w-0">
          <div className="px-4 sm:px-5 pt-4 flex items-center justify-between gap-3 min-w-0">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-semibold px-5 py-2.5 shadow-sm shrink-0"
            >
              View {typeLabel === 'BOT' ? 'Bot' : typeLabel === 'GROUP' ? 'Group' : 'Channel'}
            </a>
            <div className="flex items-center gap-3 min-w-0">
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

          <div className="px-4 sm:px-5 pt-5 pb-3 flex gap-4 min-w-0">
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
            <div className="min-w-0 flex-1 overflow-hidden">
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
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
                {entity.title}
              </h1>
              {entity.username && (
                <p className="text-[#0088cc] text-sm font-medium truncate">@{entity.username}</p>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-1.5">
            {entity.category && (
              <Link
                href={'/category/' + entity.category.slug}
                className="text-[11px] rounded-full bg-slate-100 text-slate-600 px-2.5 py-1"
              >
                {entity.category.name}
              </Link>
            )}
            {entity.language && (
              <span className="text-[11px] rounded-full bg-slate-100 text-slate-600 px-2.5 py-1">
                {entity.language}
              </span>
            )}
            {tags.map((t: string) => (
              <span key={t} className="text-[11px] rounded-full bg-blue-50 text-blue-700 px-2.5 py-1">
                #{t}
              </span>
            ))}
          </div>

          {(shortDesc || longDesc) && (
            <div className="mx-4 sm:mx-5 mb-4 rounded-xl bg-[#f7f8fa] border border-slate-100 px-4 py-3 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                Description
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words">
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
              publicPath={entityPath(entity)}
            />
          </div>

          <div className="px-4 sm:px-5 pb-5">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold py-3.5 text-sm"
            >
              Open in Telegram
            </a>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 min-w-0">
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
            <h2 className="font-bold text-slate-900 mb-3">You may like</h2>
            <ul className="space-y-2">
              {related.map((r: any) => (
                <li key={r.id}>
                  <Link
                    href={entityPath(r)}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition min-w-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold shrink-0">
                      {(r.title || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {r.username ? '@' + r.username : r.type}
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
    <div className="rounded-xl bg-[#f7f8fa] border border-slate-100 px-3 py-3 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-0.5 break-all">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>}
    </div>
  )
}
