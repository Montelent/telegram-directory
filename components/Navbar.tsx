'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Hide navbar on admin pages
  if (pathname?.startsWith('/admin')) return null

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

        {/* Desktop */}
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
          <Link
            href="/admin"
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            Admin
          </Link>
        </nav>

        {/* Mobile toggle */}
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

      {/* Mobile menu */}
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
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="py-2 text-sm text-slate-400"
            >
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
