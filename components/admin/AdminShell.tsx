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
  { href: '/admin/deposits', label: 'Deposits', icon: '💰' },
  { href: '/admin/blog', label: 'Blog', icon: '✍️' },
  { href: '/admin/users', label: 'Users', icon: '👤' },
  { href: '/admin/payments', label: 'Payment methods', icon: '💳' },
  { href: '/admin/ads', label: 'Ads', icon: '📣' },
  { href: '/admin/scripts', label: 'Header / Footer scripts', icon: '🧩' },
  { href: '/admin/footer', label: 'Footer menu', icon: '🦶' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
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

  if (pathname === '/admin/login') return <>{children}</>

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-0.5 p-3">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            isActive(item.href)
              ? 'bg-[#f8e8e8] text-[#8b1a1a]'
              : 'text-[#5c4040] hover:bg-[#faf4f4]'
          }`}
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#faf4f4] flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-[#f0e0e0] bg-white">
        <div className="h-14 flex items-center px-5 border-b border-[#f0e0e0]">
          <Link href="/admin" className="font-bold text-lg text-[#2d0808]">
            Admin Panel
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="border-t border-[#f0e0e0] p-4">
          <p className="text-xs text-[#6b5555] truncate mb-2">{email}</p>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full text-left text-sm text-[#c41e3a] px-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 border-b border-[#f0e0e0] bg-white flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2 text-[#4a0e0e]" aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/admin" className="font-bold text-[#2d0808]">Admin</Link>
        <div className="w-10" />
      </div>

      {open && <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-xl transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#f0e0e0]">
          <span className="font-bold text-[#2d0808]">Admin Panel</span>
          <button onClick={() => setOpen(false)} className="p-2">✕</button>
        </div>
        <NavLinks onNavigate={() => setOpen(false)} />
      </aside>

      <div className="flex-1 lg:pl-64">
        <main className="pt-14 lg:pt-0 min-h-screen">{children}</main>
      </div>
    </div>
  )
}
