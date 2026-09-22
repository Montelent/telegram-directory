import Link from 'next/link'
import { getSiteSettings } from '@/lib/site-settings'
import OnlineBadge from '@/components/OnlineBadge'

function parseMenu(raw?: string): { label: string; href: string }[] {
  if (!raw?.trim()) return []
  return raw
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split('|').map((s) => s.trim())
      return { label: label || href, href: href || '#' }
    })
    .filter((x) => x.label && x.href)
}

export default async function SiteFooter() {
  const s = await getSiteSettings()
  const col1 = parseMenu(s.footer_col1 || s.menu_footer)
  const col2 = parseMenu(s.footer_col2)
  const col3 = parseMenu(s.footer_col3)
  const social = parseMenu(s.footer_social)
  const siteName = s.site_name || 'Telegram Directory'
  const tagline = s.site_tagline || 'Discover public Telegram groups & channels'
  const copyright =
    s.footer_copyright ||
    `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`
  const extraHtml = s.footer_html || ''

  const defaults1 =
    col1.length > 0
      ? col1
      : [
          { label: 'Ranking', href: '/ranking' },
          { label: 'Trending', href: '/trending' },
          { label: 'Top rated', href: '/top' },
          { label: 'Explore', href: '/explore' },
        ]
  const defaults2 =
    col2.length > 0
      ? col2
      : [
          { label: 'Compare', href: '/compare' },
          { label: 'Tags', href: '/tag' },
          { label: 'Collections', href: '/collections' },
          { label: 'Blog', href: '/blog' },
        ]
  const defaults3 =
    col3.length > 0
      ? col3
      : [
          { label: 'Add media', href: '/submit' },
          { label: 'Search', href: '/search' },
          { label: 'Sign up', href: '/signup' },
          { label: 'Login', href: '/login' },
        ]

  return (
    <footer className="mt-auto border-t border-[#f0e0e0] bg-[#2d0808] text-[#f0d0d0]">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <p className="font-bold text-white text-lg mb-2">{siteName}</p>
            <p className="text-sm text-[#c4a0a0] mb-3">{tagline}</p>
            <OnlineBadge className="text-xs text-emerald-300" />
            {social.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {social.map((l) => (
                  <a
                    key={l.href + l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs rounded-full border border-[#5c3030] px-3 py-1 hover:bg-[#4a0e0e] hover:text-white"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <FooterCol title={s.footer_col1_title || 'Discover'} links={defaults1} />
          <FooterCol title={s.footer_col2_title || 'Tools'} links={defaults2} />
          <FooterCol title={s.footer_col3_title || 'Account'} links={defaults3} />
        </div>

        {extraHtml && (
          <div
            className="text-xs text-[#c4a0a0] mb-6 prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: extraHtml }}
          />
        )}

        <div className="border-t border-[#4a0e0e] pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-[#9a7070]">
          <p>{copyright}</p>
          <p className="flex items-center gap-2">
            <OnlineBadge />
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[#c4a0a0] mb-3">{title}</p>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="hover:text-white transition">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
