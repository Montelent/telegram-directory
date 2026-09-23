'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

const navGroups = [
  {
    id: 'overview',
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: '📊' }],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { href: '/admin/entities', label: 'Groups & Channels', icon: '📢' },
      { href: '/admin/categories', label: 'Categories', icon: '📁' },
      { href: '/admin/blog', label: 'Blog', icon: '✍️' },
      { href: '/admin/pages', label: 'Pages', icon: '📄' },
      { href: '/admin/submissions', label: 'Submissions', icon: '📥' },
      { href: '/admin/reports', label: 'Reports', icon: '⚑' },
    ],
  },
  {
    id: 'people',
    label: 'People & money',
    items: [
      { href: '/admin/users', label: 'Users', icon: '👤' },
      { href: '/admin/tickets', label: 'Tickets', icon: '💬' },
      { href: '/admin/deposits', label: 'Deposits', icon: '💰' },
      { href: '/admin/payments', label: 'Payment methods', icon: '💳' },
    ],
  },
  {
    id: 'setup',
    label: 'Site setup',
    items: [
      { href: '/admin/ads', label: 'Ads', icon: '📣' },
      { href: '/admin/scripts', label: 'Header / Footer scripts', icon: '🧩' },
      { href: '/admin/footer', label: 'Footer menu', icon: '🦶' },
      { href: '/admin/integrations', label: 'API Integrations', icon: '🔌' },
      { href: '/admin/email', label: 'Email & Captcha', icon: '✉️' },
      { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
]

const navItems = navGroups.flatMap((g) => g.items)
const STORAGE_KEY = 'admin-nav-open-groups'

export default function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode
  email?: string | null
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const activeItem = navItems.find((item) => isActive(item.href))
  const activeGroupId = navGroups.find((g) => g.items.some((i) => isActive(i.href)))?.id

  useEffect(() => {
    let stored: string[] = []
    try {
      stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      stored = []
    }
    const initial = new Set(stored)
    if (activeGroupId) initial.add(activeGroupId)
    else navGroups.forEach((g) => initial.add(g.id))
    setOpenGroups(initial)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || !activeGroupId) return
    setOpenGroups((prev) => {
      if (prev.has(activeGroupId)) return prev
      const next = new Set(prev)
      next.add(activeGroupId)
      persist(next)
      return next
    })
  }, [pathname, hydrated])

  function persist(set: Set<string>) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
    } catch {
      /* ignore */
    }
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      persist(next)
      return next
    })
  }

  if (pathname === '/admin/login') return <>{children}</>

  const NavAccordion = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col p-2">
      {navGroups.map((group) => {
        const isOpen = openGroups.has(group.id)
        const groupHasActive = group.items.some((i) => isActive(i.href))
        return (
          <div key={group.id} className="mb-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isOpen}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition ${
                groupHasActive ? 'text-[#8b1a1a]' : 'text-[#a88888] hover:text-[#8b1a1a]'
              }`}
            >
              {group.label}
              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`grid transition-all duration-200 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="flex flex-col gap-0.5 pb-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive(item.href) ? 'bg-[#f8e8e8] text-[#8b1a1a]' : 'text-[#5c4040] hover:bg-[#faf4f4]'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )

  const NavRail = () => (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          title={item.label}
          className={`flex items-center justify-center rounded-lg px-3 py-2.5 text-base transition ${
            isActive(item.href) ? 'bg-[#f8e8e8] text-[#8b1a1a]' : 'text-[#5c4040] hover:bg-[#faf4f4]'
          }`}
        >
          {item.icon}
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-[#faf4f4] flex overflow-x-hidden">
      <aside className="hidden md:flex lg:hidden md:flex-col md:w-16 md:fixed md:inset-y-0 border-r border-[#f0e0e0] bg-white z-30">
        <div className="h-14 flex items-center justify-center border-b border-[#f0e0e0]">
          <Link href="/admin" className="font-bold text-lg text-[#2d0808]">A</Link>
        </div>
        <div className="flex-1 overflow-y-auto"><NavRail /></div>
        <div className="border-t border-[#f0e0e0] p-2 flex justify-center">
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="p-2 text-[#c41e3a]" title="Sign out" aria-label="Sign out">⏻</button>
        </div>
      </aside>

      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-[#f0e0e0] bg-white z-30">
        <div className="h-14 flex items-center px-5 border-b border-[#f0e0e0]">
          <Link href="/admin" className="font-bold text-lg text-[#2d0808]">Admin Panel</Link>
        </div>
        <div className="flex-1 overflow-y-auto"><NavAccordion /></div>
        <div className="border-t border-[#f0e0e0] p-4">
          <p className="text-xs text-[#6b5555] truncate mb-2">{email}</p>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="w-full text-left text-sm text-[#c41e3a] px-1">Sign out</button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 border-b border-[#f0e0e0] bg-white flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2 text-[#4a0e0e]" aria-label="Open menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="font-bold text-[#2d0808] text-sm truncate max-w-[60%]">{activeItem ? `${activeItem.icon} ${activeItem.label}` : 'Admin'}</span>
        <div className="w-10" />
      </div>

      {open && <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 ease-in-out flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`} role="dialog" aria-modal="true">
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#f0e0e0] shrink-0">
          <span className="font-bold text-[#2d0808]">Admin Panel</span>
          <button onClick={() => setOpen(false)} className="p-2" aria-label="Close menu">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavAccordion onNavigate={() => setOpen(false)} />
          <div className="border-t border-[#f0e0e0] p-4 mt-2">
            <p className="text-xs text-[#6b5555] truncate mb-2">{email}</p>
            <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="w-full text-left text-sm text-[#c41e3a] px-1">Sign out</button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 md:pl-16 lg:pl-64">
        <main className="pt-14 md:pt-0 min-h-screen">{children}</main>
      </div>
    </div>
  )
}
