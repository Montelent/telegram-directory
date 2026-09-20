import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function DashboardDepositPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
  const balance = ((user as any)?.balanceCents ?? 0) / 100

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto">
      <Link href="/dashboard" className="text-xs text-violet-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Deposit</h1>
      <p className="text-sm text-slate-500 mb-6">Top up advertising balance.</p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Current balance</p>
        <p className="text-3xl font-bold mt-1">${balance.toFixed(2)}</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-sm">
        <p className="font-medium text-amber-900">First deposit gift</p>
        <p className="text-amber-800/80 mt-1">
          Use code <strong>FIRSTDEPOSIT</strong> for 10% extra credit on your first top-up.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
        <p className="text-sm text-slate-500 mb-4">
          Payment integration (Stripe / crypto) can be connected next. Admins can adjust balance under Admin → Users.
        </p>
        <p className="text-xs text-slate-400">Contact support or wait for payment gateway setup.</p>
      </div>
    </div>
  )
}
