import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function formatCount(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

async function getSetting(key: string) {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } })
    return row?.value || ''
  } catch {
    return ''
  }
}

export default async function HomePage() {
  const [categories, featured, totalApproved, userCount, blogPosts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      take: 12,
      include: {
        _count: { select: { entities: { where: { status: 'APPROVED' } } } },
      },
    }),
    prisma.entity.findMany({
      where: { status: 'APPROVED' },
      include: { category: true },
      orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    }),
    prisma.entity.count({ where: { status: 'APPROVED' } }),
    prisma.user.count().catch(() => 0),
    prisma.blogPost
      .findMany({
        where: { published: true },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        include: { category: true },
      })
      .catch(() => [] as any[]),
  ])

  const [
    fakeViews,
    fakeUsers,
    fakeMedia,
    viewsLabel,
    usersLabel,
    mediaLabel,
    useFake,
    whyTitle,
    whySubtitle,
  ] = await Promise.all([
    getSetting('stats_views_display'),
    getSetting('stats_users_display'),
    getSetting('stats_media_display'),
    getSetting('stats_views_label'),
    getSetting('stats_users_label'),
    getSetting('stats_media_label'),
    getSetting('stats_use_fake'),
    getSetting('home_why_title'),
    getSetting('home_why_subtitle'),
  ])

  const showFake = useFake === '1'

  const displayViews = showFake && fakeViews ? fakeViews : '—'
  const displayUsers =
    showFake && fakeUsers ? fakeUsers : userCount > 0 ? userCount.toLocaleString() : '0'
  const displayMedia =
    showFake && fakeMedia ? fakeMedia : totalApproved > 0 ? totalApproved.toLocaleString() : '0'

  return (
    <main className="min-h-screen bg-[#faf4f4]">
      <section className="relative overflow-hidden border-b border-[#f0e0e0]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d0808] via-[#4a0e0e] to-[#8b1a1a]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_#c41e3a_0%,_transparent_50%)]" />
        <div className="relative container mx-auto px-4 py-14 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
            Discover The Best Telegram Channels
          </h1>
          <p className="text-[#f0c8c8] text-base sm:text-lg max-w-2xl mx-auto mb-2">
            More than{' '}
            <strong className="text-white">
              {totalApproved > 0 ? totalApproved.toLocaleString() : 'thousands of'}
            </strong>{' '}
            channels, groups & communities — reviewed and updated.
          </p>

          <form
            action="/search"
            method="get"
            className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-2"
          >
            <input
              name="q"
              type="search"
              placeholder="Search channels, groups, @username…"
              className="flex-1 rounded-xl border-0 px-4 py-3 text-sm text-[#1a1212] shadow-lg focus:outline-none focus:ring-2 focus:ring-[#c41e3a]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#c41e3a] hover:bg-[#a31830] px-6 py-3 text-sm font-semibold text-white shadow-lg transition"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            <Link
              href="/ranking"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 backdrop-blur transition"
            >
              Ranking
            </Link>
            <Link
              href="/trending"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 backdrop-blur transition"
            >
              Trending
            </Link>
            <Link
              href="/top"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 backdrop-blur transition"
            >
              Rating
            </Link>
            <Link
              href="/lucky"
              className="rounded-full bg-[#c41e3a] hover:bg-[#a31830] text-white px-4 py-1.5 transition font-medium"
            >
              I&apos;m Feeling Lucky
            </Link>
          </div>
        </div>
      </section>

      {/* Why add + counters (telegramchannels-style) */}
      <section className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 py-12 sm:py-16 max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2332] mb-3">
            {whyTitle || 'Why Add Your Channel or Bot to Our Directory?'}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mb-10">
            {whySubtitle ||
              'A quality-first Telegram directory with real traffic, daily updates, and tools built for channel owners.'}
          </p>

          <div className="text-left space-y-8 mb-12">
            <div className="flex gap-4">
              <span className="text-2xl shrink-0">👥</span>
              <div>
                <h3 className="font-semibold text-[#1a2332] mb-1">Reach more subscribers</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  List on a directory people actually use. We help users discover channels, groups,
                  and bots — and we only keep active, quality listings.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl shrink-0">📈</span>
              <div>
                <h3 className="font-semibold text-[#1a2332] mb-1">Track your growth</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  We check your subscriber count and turn it into growth charts you can follow from
                  your panel.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl shrink-0">😊</span>
              <div>
                <h3 className="font-semibold text-[#1a2332] mb-1">Collect real user reviews</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Every channel gets its own rating page to share with your audience.{' '}
                  <Link href="/top" className="text-[#0088cc] hover:underline">
                    Top rated media
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl shrink-0">🔍</span>
              <div>
                <h3 className="font-semibold text-[#1a2332] mb-1">Get found on search engines</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Every channel has its own page, updated regularly and indexed by search engines
                  like Google.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-10">
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-[#1a2332]">{displayViews}</p>
              <p className="text-sm text-slate-500 mt-1">
                {viewsLabel || 'Views per Month'}
              </p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-[#1a2332]">{displayUsers}</p>
              <p className="text-sm text-slate-500 mt-1">
                {usersLabel || 'Registered Users'}
              </p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-[#1a2332]">{displayMedia}</p>
              <p className="text-sm text-slate-500 mt-1">
                {mediaLabel || 'Listed Media'}
              </p>
            </div>
          </div>

          <Link
            href="/submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold px-8 py-3.5 text-sm shadow-sm transition"
          >
            + Add Your Media For Free
          </Link>

          <p className="mt-10 text-sm text-slate-500 italic max-w-md mx-auto leading-relaxed">
            &quot;We list channels, groups, and bots, review each listing, and update media regularly.
            We only list active, high-quality listings that have real value for users.&quot;
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#c41e3a] mb-1">Featured</p>
            <h2 className="text-2xl font-bold text-[#2d0808]">Top channels & groups</h2>
          </div>
          <Link href="/ranking" className="text-sm font-medium text-[#8b1a1a] hover:underline">
            View ranking →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#f0e0e0] p-12 text-center text-[#6b5555]">
            <p className="mb-3">No channels listed yet.</p>
            <Link href="/submit" className="text-[#8b1a1a] font-medium hover:underline">
              Add your media for free →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((entity) => (
              <Link
                key={entity.id}
                href={'/entity/' + entity.id}
                className="group bg-white rounded-2xl border border-[#f0e0e0] p-4 hover:border-[#c41e3a]/40 hover:shadow-md transition flex gap-3"
              >
                {entity.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entity.photoUrl}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-[#f0e0e0] shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#f8e8e8] to-[#f0d0d0] flex items-center justify-center text-xl shrink-0">
                    {entity.type === 'CHANNEL' ? '📢' : '👥'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#8b1a1a] bg-[#f8e8e8] px-1.5 py-0.5 rounded">
                      Featured
                    </span>
                    <span className="text-[10px] text-[#6b5555]">{entity.type}</span>
                  </div>
                  <h3 className="font-semibold text-[#2d0808] mt-0.5 group-hover:text-[#8b1a1a] truncate">
                    {entity.title}
                  </h3>
                  {entity.username && <p className="text-xs text-[#8b1a1a]">@{entity.username}</p>}
                  <div className="flex gap-2 mt-1 text-[11px] text-[#6b5555]">
                    {entity.memberCount != null && (
                      <span>{formatCount(entity.memberCount)} members</span>
                    )}
                    {entity.category && <span>· {entity.category.name}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#c41e3a] mb-1">Browse</p>
              <h2 className="text-2xl font-bold text-[#2d0808]">Categories</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={'/category/' + cat.slug}
                className="bg-white rounded-xl border border-[#f0e0e0] px-4 py-4 hover:border-[#c41e3a]/50 hover:shadow-sm transition"
              >
                <span className="text-xl">{cat.icon || '📁'}</span>
                <p className="font-semibold text-[#2d0808] mt-1 text-sm">{cat.name}</p>
                <p className="text-[11px] text-[#6b5555]">{cat._count.entities} entries</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#c41e3a] mb-1">From the blog</p>
            <h2 className="text-2xl font-bold text-[#2d0808]">Latest articles</h2>
          </div>
          <Link href="/blog" className="text-sm font-medium text-[#8b1a1a] hover:underline">
            All posts →
          </Link>
        </div>

        {blogPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#f0e0e0] p-10 text-center text-[#6b5555] text-sm">
            No blog posts yet. Publish from Admin → Blog.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogPosts.map((post: any) => (
              <Link
                key={post.id}
                href={'/blog/' + post.slug}
                className="bg-white rounded-2xl border border-[#f0e0e0] overflow-hidden hover:border-[#c41e3a]/40 hover:shadow-md transition flex flex-col"
              >
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImage} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-[#4a0e0e] to-[#c41e3a] opacity-90" />
                )}
                <div className="p-4 flex-1 flex flex-col">
                  {post.category && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#c41e3a]">
                      {post.category.name}
                    </span>
                  )}
                  <h3 className="font-semibold text-[#2d0808] mt-1 line-clamp-2">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-sm text-[#6b5555] mt-1 line-clamp-2 flex-1">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-[#f0e0e0] bg-gradient-to-r from-[#2d0808] via-[#4a0e0e] to-[#8b1a1a]">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Add your media for free</h2>
          <p className="text-[#f0c8c8] text-sm max-w-lg mx-auto mb-6">
            List your channel or group. Get discovered by people searching for communities like yours.
          </p>
          <Link
            href="/submit"
            className="inline-flex justify-center rounded-xl bg-[#c41e3a] hover:bg-[#a31830] px-6 py-3 text-sm font-semibold text-white transition"
          >
            Submit a channel
          </Link>
        </div>
      </section>
    </main>
  )
}
