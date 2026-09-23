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

function formatDate(d: Date | string | null | undefined) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

  const shortDesc = entity.shortDesc || entity.description || ''
  const longDesc = entity.longDesc && entity.longDesc !== shortDesc ? entity.longDesc : ''
  const tags = (entity.tags || '')
    .split(/[,#\s]+/)
    .map((t: string) => t.trim().replace(/^#/, ''))
    .filter(Boolean)
    .slice(0, 10)

  const jsonLd =
    entity.seoJsonLd ||
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: entity.title,
      description: shortDesc || undefined,
      url: entityPath(entity),
      image: entity.photoUrl || undefined,
    })

  const viewLabel =
    typeLabel === 'BOT' ? 'View Bot' : typeLabel === 'GROUP' ? 'View Group' : 'View Channel'

  return (
    <main className="min-h-screen bg-[#f0f2f5] overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-lg min-w-0">
        <nav className="text-[11px] text-slate-500 mb-3 flex flex-wrap items-center gap-1" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#0088cc]">Home</Link>
          <span>/</span>
          <Link href={typeLabel === 'BOT' ? '/bots' : typeLabel === 'GROUP' ? '/groups' : '/channels'} className="hover:text-[#0088cc]">
            {typeLabel === 'BOT' ? 'Bots' : typeLabel === 'GROUP' ? 'Groups' : 'Channels'}
          </Link>
          {entity.category && (<><span>/</span><Link href={'/category/' + entity.category.slug} className="hover:text-[#0088cc]">{entity.category.name}</Link></>)}
          <span>/</span>
          <span className="text-slate-700 truncate max-w-[10rem]">{entity.title}</span>
        </nav>

        <AdSlot slot="header" />

        <article className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden min-w-0">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-slate-200">
            {entity.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entity.photoUrl} alt={entity.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#4a0e0e] via-[#8b1a1a] to-[#c41e3a] flex items-center justify-center">
                <span className="text-6xl font-bold text-white/40">{(entity.title || '?')[0]?.toUpperCase()}</span>
              </div>
            )}
            <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white bg-black/55 backdrop-blur-sm px-2.5 py-1 rounded-md">{typeLabel}</span>
            <div className="absolute top-3 right-3"><ReportMenu entityId={entity.id} title={entity.title} /></div>
          </div>

          <div className="px-4 sm:px-5 pt-4 pb-5 space-y-4">
            <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white text-sm font-semibold py-3 shadow-sm transition">
              {viewLabel}
            </a>

            <p className="text-[11px] text-center text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
              <strong>Attention:</strong> Please conduct your own research before trusting the content. Especially if they asked you for money.
            </p>

            {entity.username && (
              <p className="text-center text-xs text-slate-500">
                Can't join?{' '}
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="text-[#0088cc] font-medium hover:underline">@{entity.username}</a>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {entity.createdAt && (<span className="inline-flex items-center gap-1"><span aria-hidden>📅</span>{formatDate(entity.createdAt)}</span>)}
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700"><span aria-hidden>👥</span>{formatCount(entity.memberCount)}</span>
            </div>

            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight break-words">{entity.title}</h1>
              {entity.isVerified && (<span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-blue-600">✓ Verified</span>)}
            </div>

            {shortDesc && (<p className="text-sm text-slate-600 leading-relaxed text-center whitespace-pre-line break-words">{shortDesc}</p>)}

            {tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {tags.map((t: string) => (
                  <Link key={t} href={'/tag/' + encodeURIComponent(t.toLowerCase())} className="text-[11px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 transition">#{t}</Link>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f7f8fa] border border-slate-100 p-3">
              <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">USERNAME</p><p className="text-sm font-semibold text-slate-800 mt-0.5 truncate font-mono text-[13px]">{entity.username ? '@' + entity.username : '—'}</p></div>
              <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">CATEGORY</p><p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{entity.category?.name || '—'}</p></div>
              <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">SUBSCRIBERS</p><p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{formatCount(entity.memberCount)}</p></div>
              <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">LANGUAGE</p><p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{entity.language || '—'}</p></div>
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">Rankings</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f7f8fa] border border-slate-100 px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Global Rank</p><p className="text-lg font-bold text-slate-900 mt-0.5">{globalRank != null ? '#' + globalRank.toLocaleString() : '—'}</p></div>
                <div className="rounded-xl bg-[#f7f8fa] border border-slate-100 px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Language Rank</p><p className="text-lg font-bold text-slate-900 mt-0.5">{languageRank != null ? '#' + languageRank.toLocaleString() : '—'}</p></div>
                <div className="rounded-xl bg-[#f7f8fa] border border-slate-100 px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Category Rank</p><p className="text-lg font-bold text-slate-900 mt-0.5">{categoryRank != null ? '#' + categoryRank.toLocaleString() : '—'}</p></div>
                <div className="rounded-xl bg-[#f7f8fa] border border-slate-100 px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Members</p><p className="text-lg font-bold text-slate-900 mt-0.5">{formatFull(entity.memberCount)}</p></div>
              </div>
              <RankShareActions entityId={entity.id} title={entity.title} username={entity.username} memberCount={entity.memberCount} type={entity.type} globalRank={globalRank} publicPath={entityPath(entity)} />
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-1">Rate</h2>
              <p className="text-xs text-slate-500 mb-3">Rate This Media:</p>
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

            {longDesc && (
              <div className="rounded-xl border border-slate-100 p-4">
                <h2 className="text-sm font-semibold text-slate-800 mb-3">About</h2>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line break-words">{longDesc}</div>
              </div>
            )}

            <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold py-3.5 text-sm transition">
              Open in Telegram
            </a>
          </div>
        </article>

        {related.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <h2 className="font-bold text-slate-900 mb-3">You may like</h2>
            <ul className="space-y-2">
              {related.map((r: any) => (
                <li key={r.id}>
                  <Link href={entityPath(r)} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold shrink-0">{(r.title || '?')[0]?.toUpperCase()}</div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{r.username ? '@' + r.username : r.type}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 shrink-0">{formatCount(r.memberCount)}</span>
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
