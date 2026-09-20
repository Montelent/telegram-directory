import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    redirect('/login?callbackUrl=/dashboard')
  }

  const userId = (session.user as any).id as string
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) redirect('/login')

  let media: { id: string; username: string; title: string | null; type: string; status: string }[] =
    []
  try {
    media = await prisma.userMedia.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
  } catch {
    /* */
  }

  const balance = ((user as any).balanceCents ?? 0) / 100
  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 mb-1">
          Overview
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome back, {displayName}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Your channels, ads, and balance — in one place.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Balance"
          value={`$${balance.toFixed(2)}`}
          icon={
            <span className="text-violet-500">💳</span>
          }
        />
        <StatCard label="Media" value={String(media.length)} icon={<span>📁</span>} />
        <StatCard label="Active ads" value="0" icon={<span>📣</span>} />
        <StatCard label="Collections" value="0" icon={<span>🗂</span>} />
      </div>

      {/* Promo / first deposit */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            First deposit gift
          </p>
          <p className="font-semibold text-slate-900 mt-0.5">Get 10% extra credit</p>
          <p className="text-sm text-slate-600 mt-1">
            Use code <code className="bg-white/80 px-1.5 py-0.5 rounded text-amber-800 font-mono text-xs">FIRSTDEPOSIT</code> on your first top-up.
          </p>
        </div>
        <Link
          href="/dashboard/deposit"
          className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 shrink-0"
        >
          Claim gift →
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <QuickAction href="/dashboard/media" label="Add media" icon="+" />
        <QuickAction href="/dashboard/ads" label="Advertising" icon="📣" />
        <QuickAction href="/dashboard/collections" label="Collections" icon="☰" />
        <QuickAction href="/dashboard/deposit" label="Top up" icon="💳" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Media */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Media</h2>
              <p className="text-xs text-slate-400">Recent submissions</p>
            </div>
            <Link href="/dashboard/media" className="text-xs font-medium text-violet-600 hover:underline">
              View all
            </Link>
          </div>
          {media.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2 opacity-40">📁</div>
              <p className="text-sm text-slate-400 mb-3">No media yet</p>
              <Link
                href="/dashboard/media"
                className="text-sm font-medium text-violet-600 hover:underline"
              >
                + Add media
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {media.map((m) => (
                <li key={m.id} className="py-3 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.title || `@${m.username}`}</p>
                    <p className="text-xs text-slate-400">@{m.username}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ads */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Ads</h2>
              <p className="text-xs text-slate-400">Active campaigns</p>
            </div>
            <Link href="/dashboard/ads" className="text-xs font-medium text-violet-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="py-10 text-center">
            <div className="text-3xl mb-2 opacity-40">📣</div>
            <p className="text-sm text-slate-400 mb-3">No active ads</p>
            <Link
              href="/dashboard/deposit"
              className="text-sm font-medium text-violet-600 hover:underline"
            >
              Top up to advertise
            </Link>
          </div>
        </section>
      </div>

      {/* Checklist */}
      <section className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Get the most out of the directory</h2>
        <p className="text-xs text-slate-400 mb-4">A short checklist to list, grow, and promote your media.</p>
        <ul className="space-y-3 text-sm text-slate-600">
          <ChecklistItem href="/dashboard/media" done={media.length > 0}>
            Add your first channel, group, or bot
          </ChecklistItem>
          <ChecklistItem href="/dashboard/media" done={media.some((m) => m.status === 'APPROVED')}>
            Get media approved for the directory
          </ChecklistItem>
          <ChecklistItem href="/dashboard/deposit" done={balance > 0}>
            Top up your advertising balance
          </ChecklistItem>
          <ChecklistItem href="/dashboard/ads" done={false}>
            Launch your first ad campaign
          </ChecklistItem>
          <ChecklistItem href="/dashboard/collections" done={false}>
            Create a collection to group related media
          </ChecklistItem>
        </ul>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        {icon}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-white py-4 shadow-sm hover:border-violet-200 hover:shadow transition text-center"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'APPROVED'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'PENDING'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-600'
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  )
}

function ChecklistItem({
  children,
  href,
  done,
}: {
  children: React.ReactNode
  href: string
  done: boolean
}) {
  return (
    <li>
      <Link href={href} className="flex items-start gap-3 hover:text-violet-700">
        <span
          className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs ${
            done
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'border-slate-300 text-transparent'
          }`}
        >
          ✓
        </span>
        <span className={done ? 'line-through text-slate-400' : ''}>{children}</span>
      </Link>
    </li>
  )
}
