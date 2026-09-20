'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/entities', label: 'Groups & Channels', icon: '📢' },
  { href: '/admin/categories', label: 'Categories', icon: '📁' },
  { href: '/admin/submissions', label: 'Submissions', icon: '📥' },
  { href: '/admin/blog', label: 'Blog', icon: '✍️' },
  { href: '/admin/integrations', label: 'API Integrations', icon: '🔌' },
]

export default function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode
  email?: string | null
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isActive(item.href)
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-white">
        <div className="h-14 flex items-center px-5 border-b">
          <Link href="/admin" className="font-bold text-lg text-slate-900">
            Admin Panel
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="border-t p-4">
          <p className="text-xs text-slate-500 truncate mb-2">{email}</p>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full text-left text-sm text-red-600 hover:text-red-700 px-1"
          >
            Sign out
          </button>
          <Link href="/" className="block mt-2 text-xs text-slate-400 hover:text-slate-600 px-1">
            ← Back to site
          </Link>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 border-b bg-white flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2 text-slate-600" aria-label="Open menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/admin" className="font-bold text-slate-900">Admin</Link>
        <div className="w-10" />
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <span className="font-bold text-slate-900">Admin Panel</span>
          <button onClick={() => setOpen(false)} className="p-2 text-slate-500" aria-label="Close menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <NavLinks onNavigate={() => setOpen(false)} />
        <div className="border-t p-4">
          <p className="text-xs text-slate-500 truncate mb-2">{email}</p>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full text-left text-sm text-red-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64">
        <main className="pt-14 lg:pt-0 min-h-screen">{children}</main>
      </div>
    </div>
  )
}
