import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getEnabledPaymentMethods } from '@/lib/payments'
import DepositClient from '@/components/DepositClient'

export const dynamic = 'force-dynamic'

export default async function DashboardDepositPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
  const balance = ((user as any)?.balanceCents ?? 0) / 100

  let methods: Awaited<ReturnType<typeof getEnabledPaymentMethods>> = []
  try {
    methods = await getEnabledPaymentMethods()
  } catch {
    methods = []
  }

  let recent: { id: string; amountCents: number; method: string; status: string; reference: string | null; createdAt: Date }[] = []
  try {
    recent = await prisma.deposit.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  } catch {
    recent = []
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-lg mx-auto">
      <Link href="/dashboard" className="text-xs text-violet-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Deposit</h1>
      <p className="text-sm text-slate-500 mb-6">Top up your advertising balance.</p>

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

      {methods.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
          <p className="text-sm text-slate-600 mb-2">No payment methods are enabled yet.</p>
          <p className="text-xs text-slate-400">
            Admin must enable methods under <strong>Admin → Payments</strong> and click Save.
          </p>
        </div>
      ) : (
        <DepositClient methods={methods} />
      )}

      {recent.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-sm mb-3">Recent deposits</h2>
          <ul className="bg-white rounded-2xl border border-slate-100 divide-y">
            {recent.map((d) => (
              <li key={d.id} className="px-4 py-3 flex justify-between text-sm">
                <div>
                  <p className="font-medium">${(d.amountCents / 100).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">
                    {d.method} · {d.reference}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase self-center px-2 py-0.5 rounded-full ${
                    d.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : d.status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
