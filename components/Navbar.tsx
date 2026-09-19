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

  if (pathname?.startsWith('/admin')) return null

  const isUser = session && (session.user as any)?.role === 'user'

  const links = [
    { href: '/search', label: 'Search' },
    { href: '/submit', label: 'Submit' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-slate-900">
          Telegram Directory
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hover:text-blue-600 transition ${
                pathname === l.href ? 'text-blue-600 font-medium' : 'text-slate-600'
              }`}
            >
              {l.label}
            </Link>
          ))}

          {status === 'loading' ? null : isUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 text-slate-700 font-medium"
              >
                {session?.user?.name || session?.user?.email?.split('@')[0] || 'Account'}
                <span className="text-xs">▼</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50 py-1">
                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Account
                    </Link>
                    <Link
                      href="/account/submissions"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      My Submissions
                    </Link>
                    <Link
                      href="/account/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-blue-600">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-white font-medium hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>

        <button
          className="sm:hidden p-2 text-slate-600"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
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
        <div className="sm:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-2 text-sm ${
                  pathname === l.href ? 'text-blue-600 font-medium' : 'text-slate-600'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {isUser ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="py-2 text-sm text-slate-600">Account</Link>
                <Link href="/account/submissions" onClick={() => setOpen(false)} className="py-2 text-sm text-slate-600">My Submissions</Link>
                <Link href="/account/settings" onClick={() => setOpen(false)} className="py-2 text-sm text-slate-600">Settings</Link>
                <button
                  onClick={() => {
                    setOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="py-2 text-sm text-red-600 text-left"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="py-2 text-sm text-slate-600">Log in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="py-2 text-sm text-blue-600 font-medium">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
