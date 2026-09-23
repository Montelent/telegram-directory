'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/dashboard/media', label: 'Media List', icon: '🔗' },
  { href: '/dashboard/collections', label: 'My Collections', icon: '☰' },
  { href: '/dashboard/tickets', label: 'Support tickets', icon: '💬' },
  { href: '/dashboard/deposit', label: 'Deposit', icon: '💼' },
  { href: '/dashboard/ads', label: 'Advertising', icon: '📢' },
  { href: '/dashboard/earn', label: 'Earn/Advertise', icon: '↩' },
  { href: '/dashboard/api', label: 'API', icon: '🔌' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
]

export default function UserDashboardShell({
  children,
  email,
  name,
}: {
  children: React.ReactNode
  email?: string | null
  name?: string | null
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(true)

  function active(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-[#eef1f6]">
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-lg">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full mb-3 flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200/80 shadow-sm px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <span className="text-slate-400">{menuOpen ? '⌃' : '☰'}</span>
          {menuOpen ? 'Hide Menu' : 'Show Menu'}
        </button>

        {menuOpen && (
          <div className="mb-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            <nav className="p-2 space-y-0.5">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition ${
                    active(item.href)
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      active(item.href)
                        ? 'bg-[#1a2332] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">{name || email}</span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-[#c41e3a] font-medium shrink-0"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
