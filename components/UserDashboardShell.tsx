'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: 'overview' },
  { href: '/dashboard/media', label: 'Media list', icon: 'media' },
  { href: '/dashboard/collections', label: 'My collections', icon: 'collections' },
  { href: '/dashboard/deposit', label: 'Deposit', icon: 'deposit' },
  { href: '/dashboard/ads', label: 'Advertising', icon: 'ads' },
  { href: '/account', label: 'Account', icon: 'account' },
]

function Icon({ name }: { name: string }) {
  const cls = 'w-5 h-5'
  switch (name) {
    case 'overview':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    case 'media':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    case 'collections':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    case 'deposit':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'ads':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    default:
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
  }
}

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
  const [open, setOpen] = useState(false)

  function active(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const Nav = ({ onNav }: { onNav?: () => void }) => (
    <nav className="flex flex-col gap-0.5 px-3 py-4">
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Overview
      </p>
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNav}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            active(item.href)
              ? 'bg-violet-50 text-violet-700'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#f6f7fb] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-[260px] md:fixed md:inset-y-0 bg-white border-r border-slate-100">
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <Link href="/" className="font-bold text-slate-900 tracking-tight">
            Telegram Directory
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Nav />
        </div>
        <div className="p-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 truncate">{name || email}</p>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mt-2 text-xs text-red-500 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2" aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-semibold text-sm">Dashboard</span>
        <Link href="/" className="text-xs text-violet-600">Site</Link>
      </div>

      {open && <div className="md:hidden fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)} />}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <span className="font-bold">Menu</span>
          <button onClick={() => setOpen(false)}>✕</button>
        </div>
        <Nav onNav={() => setOpen(false)} />
      </aside>

      <div className="flex-1 md:pl-[260px]">
        <div className="pt-14 md:pt-0 min-h-screen">{children}</div>
      </div>
    </div>
  )
}
