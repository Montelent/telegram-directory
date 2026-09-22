import Link from 'next/link'

export default function EarnPage() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900 mb-2">Earn / Advertise</h1>
      <p className="text-sm text-slate-500 mb-4">
        Promote your channel or earn by running campaigns. Use your deposit balance for featuring and ads.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/ads"
          className="rounded-xl bg-[#1a2332] text-white text-sm font-semibold px-4 py-2.5"
        >
          Advertising
        </Link>
        <Link
          href="/dashboard/deposit"
          className="rounded-xl border border-slate-200 text-sm font-medium px-4 py-2.5"
        >
          Top up balance
        </Link>
      </div>
    </div>
  )
}
