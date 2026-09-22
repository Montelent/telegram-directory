// Shared shape for the site header menu, editable from
// Admin → Settings → Menu, and consumed by components/Navbar.tsx.

export type MenuLink = { href: string; label: string; icon: string }
export type MenuSection = { title: string; icon: string; links: MenuLink[] }

/** The defaults Navbar.tsx used before this became editable. Used as the
 *  fallback so existing sites keep their current menu until an admin saves
 *  a change, and as the starting point when the editor first loads. */
export const DEFAULT_TOP_LINKS: MenuLink[] = [
  { href: '/ranking', label: 'Ranking', icon: '' },
  { href: '/trending', label: 'Trending', icon: '' },
  { href: '/top', label: 'Rating', icon: '' },
]

export const DEFAULT_DRAWER: MenuSection[] = [
  {
    title: 'Media',
    icon: 'M',
    links: [
      { href: '/channels', label: 'Channels', icon: 'C' },
      { href: '/groups', label: 'Groups', icon: 'G' },
      { href: '/bots', label: 'Bots', icon: 'B' },
    ],
  },
  {
    title: 'Discover',
    icon: 'D',
    links: [
      { href: '/ranking', label: 'Ranking', icon: 'R' },
      { href: '/trending', label: 'Trending', icon: 'T' },
      { href: '/top', label: 'Rating', icon: 'S' },
      { href: '/explore', label: 'Explore', icon: 'E' },
      { href: '/lucky', label: "I'm Feeling Lucky", icon: '*' },
    ],
  },
  {
    title: 'Tools',
    icon: 'T',
    links: [
      { href: '/search', label: 'Search', icon: '?' },
      { href: '/compare', label: 'Compare', icon: '=' },
      { href: '/tag', label: 'Tags', icon: '#' },
      { href: '/collections', label: 'Collections', icon: 'L' },
    ],
  },
  {
    title: 'Content',
    icon: 'W',
    links: [
      { href: '/blog', label: 'Blog', icon: 'B' },
      { href: '/submit', label: 'Add media', icon: '+' },
    ],
  },
]

/** Parses the flat "Label|/path" lines used for menu_header. */
export function parseTopLinks(raw?: string): MenuLink[] {
  if (!raw?.trim()) return DEFAULT_TOP_LINKS
  const rows = raw
    .split(/\n|,/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split('|').map((s) => s.trim())
      return { label: label || '', href: href || '', icon: '' }
    })
    .filter((r) => r.label && r.href)
  return rows.length > 0 ? rows : DEFAULT_TOP_LINKS
}

export function serializeTopLinks(rows: MenuLink[]): string {
  return rows
    .filter((r) => r.label.trim() && r.href.trim())
    .map((r) => `${r.label}|${r.href}`)
    .join('\n')
}

/** Parses menu_drawer_json (a JSON-encoded MenuSection[]). Falls back to the
 *  original hardcoded sections on missing/invalid data so existing sites
 *  don't lose their menu on first load after this shipped. */
export function parseDrawerSections(raw?: string): MenuSection[] {
  if (!raw?.trim()) return DEFAULT_DRAWER
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_DRAWER
    const sections: MenuSection[] = parsed
      .filter((s: any) => s && typeof s.title === 'string')
      .map((s: any) => ({
        title: s.title || '',
        icon: typeof s.icon === 'string' ? s.icon : '',
        links: Array.isArray(s.links)
          ? s.links
              .filter((l: any) => l && typeof l.label === 'string' && typeof l.href === 'string')
              .map((l: any) => ({
                label: l.label,
                href: l.href,
                icon: typeof l.icon === 'string' ? l.icon : '',
              }))
          : [],
      }))
    return sections.length > 0 ? sections : DEFAULT_DRAWER
  } catch {
    return DEFAULT_DRAWER
  }
}

export function serializeDrawerSections(sections: MenuSection[]): string {
  const cleaned = sections
    .filter((s) => s.title.trim())
    .map((s) => ({
      title: s.title,
      icon: s.icon || s.title.charAt(0).toUpperCase(),
      links: s.links.filter((l) => l.label.trim() && l.href.trim()),
    }))
  return JSON.stringify(cleaned)
}
