'use client'

import { useState } from 'react'

type Method = {
  id: string
  label: string
  kind: 'gateway' | 'bank' | 'crypto'
  min: number
  max: number
  fee: number
  details: Record<string, string>
}

export default function DepositClient({ methods }: { methods: Method[] }) {
  const [methodId, setMethodId] = useState(methods[0]?.id || '')
  const [amount, setAmount] = useState('20')
  const [promo, setPromo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  const method = methods.find((m) => m.id === methodId) || methods[0]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const amountUsd = parseFloat(amount)
    if (Number.isNaN(amountUsd)) {
      setError('Enter a valid amount')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: methodId,
          amountUsd,
          promoCode: promo || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed')
        setLoading(false)
        return
      }
      setResult(data)
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  if (result?.deposit) {
    const d = result.deposit
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold text-emerald-700">Deposit created</p>
        <p className="text-xs text-slate-500">{result.message}</p>
        <div className="text-sm space-y-1">
          <p>
            <span className="text-slate-400">Reference:</span>{' '}
            <code className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded">{d.reference}</code>
          </p>
          <p>
            <span className="text-slate-400">You pay:</span> ${Number(d.chargeUsd).toFixed(2)}
          </p>
          <p>
            <span className="text-slate-400">You receive:</span> ${Number(d.creditUsd).toFixed(2)} credit
          </p>
          <p>
            <span className="text-slate-400">Method:</span> {d.label}
          </p>
        </div>

        {(d.kind === 'bank' || d.kind === 'crypto') && d.details && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm space-y-2">
            <p className="font-semibold text-slate-800">Payment details</p>
            {d.details.bank_name && <p>Bank: {d.details.bank_name}</p>}
            {d.details.account_name && <p>Account name: {d.details.account_name}</p>}
            {d.details.account_number && (
              <p>
                Account number:{' '}
                <code className="font-mono">{d.details.account_number}</code>
              </p>
            )}
            {d.details.network && <p>Network: {d.details.network}</p>}
            {d.details.wallet_address && (
              <p className="break-all">
                Wallet: <code className="font-mono text-xs">{d.details.wallet_address}</code>
              </p>
            )}
            {d.details.memo && <p>Memo: {d.details.memo}</p>}
            {d.details.instructions && (
              <p className="text-xs text-slate-600 whitespace-pre-line">{d.details.instructions}</p>
            )}
            <p className="text-xs text-amber-700 mt-2">
              Include reference <strong>{d.reference}</strong> in the transfer description.
            </p>
          </div>
        )}

        {d.kind === 'gateway' && (
          <p className="text-xs text-slate-500">
            Online gateway checkout will open here in a future update. For now your deposit is{' '}
            <strong>pending</strong> — admin can mark it completed after payment.
          </p>
        )}

        <button
          type="button"
          onClick={() => setResult(null)}
          className="text-sm text-violet-600 hover:underline"
        >
          Make another deposit
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Payment method</label>
        <div className="mt-2 space-y-2">
          {methods.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition ${
                methodId === m.id
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="method"
                checked={methodId === m.id}
                onChange={() => setMethodId(m.id)}
              />
              <span className="flex-1 text-sm font-medium">{m.label}</span>
              <span className="text-[10px] uppercase text-slate-400">{m.kind}</span>
            </label>
          ))}
        </div>
      </div>

      {method && (
        <p className="text-xs text-slate-400">
          Limits: ${method.min} – ${method.max}
          {method.fee > 0 ? ` · Fee ${method.fee}%` : ''}
        </p>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700">Amount (USD)</label>
        <input
          type="number"
          step="0.01"
          min={method?.min || 1}
          max={method?.max || 10000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Promo code (optional)</label>
        <input
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          placeholder="FIRSTDEPOSIT"
          className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !methodId}
        className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 text-sm disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Continue'}
      </button>
    </form>
  )
}
