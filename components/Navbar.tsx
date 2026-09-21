'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) return null

  const isUser = session && (session.user as any)?.role === 'user'

  const topLinks = [
    { href: '/ranking', label: 'Ranking' },
    { href: '/trending', label: 'Trending' },
    { href: '/top', label: 'Rating' },
  ]

  const mainLinks = [
    { href: '/search', label: 'Search' },
    { href: '/blog', label: 'Blog' },
    { href: '/submit', label: 'Add media' },
  ]

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#2d0808] text-[#f0d0d0] text-[11px]">
        <div className="container mx-auto px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online directory
            </span>
            {topLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hidden sm:inline hover:text-white transition"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
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

      <div className="bg-white border-b border-[#f0e0e0] shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c41e3a] to-[#4a0e0e] flex items-center justify-center text-white text-sm font-bold">
              TG
            </span>
            <span className="font-bold text-[#2d0808] text-lg tracking-tight">
              Telegram Directory
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {mainLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition ${
                  pathname === l.href || pathname?.startsWith(l.href + '/')
                    ? 'text-[#8b1a1a]'
                    : 'text-[#5c4040] hover:text-[#8b1a1a]'
                }`}
              >
                {l.label}
              </Link>
            ))}

            {status === 'loading' ? null : isUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="text-[#5c4040] hover:text-[#8b1a1a] font-medium"
                >
                  {session?.user?.name || session?.user?.email?.split('@')[0] || 'Account'} ▾
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-[#f0e0e0] rounded-xl shadow-lg z-50 py-1 text-sm">
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 hover:bg-[#faf4f4]">Dashboard</Link>
                      <Link href="/account" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 hover:bg-[#faf4f4]">Account</Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                        className="w-full text-left px-4 py-2 text-[#c41e3a] hover:bg-[#faf4f4]"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-[#8b1a1a] to-[#4a0e0e] px-4 py-1.5 text-white text-sm font-semibold hover:opacity-95"
              >
                Join free
              </Link>
            )}
          </nav>

          <button
            className="md:hidden p-2 text-[#4a0e0e]"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-[#f0e0e0] bg-white">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1 text-sm">
              {[...topLinks, ...mainLinks].map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="py-2 text-[#5c4040]"
                >
                  {l.label}
                </Link>
              ))}
              {isUser ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="py-2">Dashboard</Link>
                  <button onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }) }} className="py-2 text-left text-[#c41e3a]">Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="py-2">Log in</Link>
                  <Link href="/signup" onClick={() => setOpen(false)} className="py-2 font-semibold text-[#8b1a1a]">Sign up</Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
