'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import OnlineBadge from '@/components/OnlineBadge'

type LinkItem = { href: string; label: string; icon: string }
type Section = { title: string; icon: string; links: LinkItem[] }

const DRAWER: Section[] = [
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
  {
    title: 'Account',
    icon: 'A',
    links: [], // filled dynamically
  },
]

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  /** All sections start collapsed until user expands */
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const { data: session, status } = useSession()

  if (pathname?.startsWith('/admin')) return null

  const isUser = session && (session.user as any)?.role === 'user'

  const topLinks = [
    { href: '/ranking', label: 'Ranking' },
    { href: '/trending', label: 'Trending' },
    { href: '/top', label: 'Rating' },
  ]

  function closeDrawer() {
    setDrawerOpen(false)
  }

  function toggleSection(title: string) {
    setOpenSections((s) => ({ ...s, [title]: !s[title] }))
  }

  function linkActive(href: string) {
    return pathname === href || Boolean(pathname?.startsWith(href + '/'))
  }

  const accountLinks: LinkItem[] = isUser
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: 'D' },
        { href: '/dashboard/settings', label: 'Settings', icon: 'S' },
      ]
    : [
        { href: '/login', label: 'Log in', icon: 'L' },
        { href: '/signup', label: 'Sign up', icon: '+' },
      ]

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#1a2332] text-[#c8d0dc] text-[11px]">
        <div className="container mx-auto px-3 sm:px-4 h-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 overflow-hidden">
            <OnlineBadge className="text-emerald-300 shrink-0" />
            {topLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hidden sm:inline hover:text-white transition shrink-0"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {status !== 'loading' && isUser ? (
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-white hidden sm:inline">
                  Log in
                </Link>
                <Link href="/signup" className="hover:text-white">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 min-w-0" onClick={closeDrawer}>
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c41e3a] to-[#4a0e0e] flex items-center justify-center text-white text-sm font-bold shrink-0">
              TG
            </span>
            <span className="font-bold text-[#1a2332] text-base sm:text-lg tracking-tight truncate">
              Telegram Directory
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/search"
              className="p-2 text-slate-600 hover:text-[#1a2332] rounded-lg"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>

            {status !== 'loading' && isUser && (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="text-sm font-medium text-slate-600 hover:text-[#1a2332] px-2"
                >
                  {session?.user?.name || session?.user?.email?.split('@')[0] || 'Account'} v
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 text-sm">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 hover:bg-slate-50"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 hover:bg-slate-50"
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-slate-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              className="p-2 text-[#1a2332] rounded-lg hover:bg-slate-100"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />
          <aside className="absolute inset-y-0 right-0 w-[min(100%,20rem)] bg-white shadow-2xl flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
              <span className="font-bold text-[#1a2332]">Menu</span>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
                aria-label="Close"
              >
                x
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {DRAWER.map((section) => {
                const links = section.title === 'Account' ? accountLinks : section.links
                const open = openSections[section.title] === true
                return (
                  <div key={section.title} className="border-b border-slate-50">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                        <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {section.icon}
                        </span>
                        {section.title}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">{open ? '▲' : '▼'}</span>
                    </button>
                    {open && (
                      <nav className="px-3 pb-3 space-y-0.5">
                        {links.map((l) => {
                          const active = linkActive(l.href)
                          const cls = active
                            ? 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium bg-slate-100 text-[#1a2332]'
                            : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50'
                          return (
                            <Link key={l.href} href={l.href} onClick={closeDrawer} className={cls}>
                              <span className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold">
                                {l.icon}
                              </span>
                              {l.label}
                            </Link>
                          )
                        })}
                        {section.title === 'Account' && isUser && (
                          <button
                            type="button"
                            onClick={() => {
                              closeDrawer()
                              signOut({ callbackUrl: '/' })
                            }}
                            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-xs font-bold">
                              X
                            </span>
                            Sign out
                          </button>
                        )}
                      </nav>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}
