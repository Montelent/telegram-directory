'use client'

import { useEffect, useState } from 'react'

const METHODS = [
  { id: 'paypal', label: 'PayPal', fields: ['client_id', 'secret', 'mode'] },
  { id: 'paystack', label: 'Paystack', fields: ['public_key', 'secret_key'] },
  { id: 'flutterwave', label: 'Flutterwave', fields: ['public_key', 'secret_key', 'encryption_key'] },
  { id: 'monnify', label: 'Monnify', fields: ['api_key', 'secret_key', 'contract_code'] },
  { id: 'bank_transfer', label: 'Bank Transfer', fields: ['bank_name', 'account_name', 'account_number', 'instructions'] },
  { id: 'usdt', label: 'USDT', fields: ['network', 'wallet_address', 'memo'] },
  { id: 'usdc', label: 'USDC', fields: ['network', 'wallet_address'] },
  { id: 'btc', label: 'Bitcoin (BTC)', fields: ['wallet_address'] },
  { id: 'bnb', label: 'BNB', fields: ['network', 'wallet_address'] },
  { id: 'tron', label: 'TRON (TRX)', fields: ['wallet_address'] },
] as const

export default function AdminPaymentsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [active, setActive] = useState('paypal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [errDetail, setErrDetail] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || {}))
      .finally(() => setLoading(false))
  }, [])

  function key(method: string, field: string) {
    return `pay_${method}_${field}`
  }

  function enabledKey(method: string) {
    return `pay_${method}_enabled`
  }

  function set(k: string, v: string) {
    setSettings((s) => ({ ...s, [k]: v }))
  }

  async function save() {
    setSaving(true)
    setMsg('')
    setErrDetail('')
    // Only send payment-related keys + current method fields to avoid huge payloads
    const payload: Record<string, string> = {}
    for (const [k, v] of Object.entries(settings)) {
      if (k.startsWith('pay_')) payload[k] = v
    }
    // Ensure current method toggles/fields included
    for (const m of METHODS) {
      payload[enabledKey(m.id)] = settings[enabledKey(m.id)] || '0'
      for (const f of m.fields) {
        payload[key(m.id, f)] = settings[key(m.id, f)] || ''
      }
      payload[`pay_${m.id}_min`] = settings[`pay_${m.id}_min`] || '5'
      payload[`pay_${m.id}_max`] = settings[`pay_${m.id}_max`] || '5000'
      payload[`pay_${m.id}_fee`] = settings[`pay_${m.id}_fee`] || '0'
    }

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: payload }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (res.ok) {
      setMsg('Payment settings saved.')
    } else {
      setMsg(data.error || 'Failed to save.')
      setErrDetail(data.detail || '')
    }
  }

  const method = METHODS.find((m) => m.id === active)!

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-[#2d0808] mb-1">Payment methods</h1>
      <p className="text-sm text-[#6b5555] mb-6">
        Enable gateways and wallets for user deposits. Values are stored in the site_settings table.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 shrink-0 space-y-1">
          {METHODS.map((m) => {
            const on = settings[enabledKey(m.id)] === '1'
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActive(m.id)}
                className={`w-full text-left rounded-lg px-3 py-2.5 text-sm flex items-center justify-between ${
                  active === m.id
                    ? 'bg-[#f8e8e8] text-[#8b1a1a] font-medium'
                    : 'text-[#5c4040] hover:bg-[#faf4f4]'
                }`}
              >
                {m.label}
                <span className={`w-2 h-2 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </button>
            )
          })}
        </nav>

        <div className="flex-1 max-w-xl bg-white rounded-2xl border border-[#f0e0e0] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#2d0808]">{method.label}</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings[enabledKey(method.id)] === '1'}
                onChange={(e) => set(enabledKey(method.id), e.target.checked ? '1' : '0')}
              />
              Enabled
            </label>
          </div>

          {method.fields.map((f) => (
            <div key={f}>
              <label className="text-xs font-medium text-[#6b5555] uppercase tracking-wide">
                {f.replace(/_/g, ' ')}
              </label>
              {f === 'instructions' || f === 'memo' ? (
                <textarea
                  value={settings[key(method.id, f)] || ''}
                  onChange={(e) => set(key(method.id, f), e.target.value)}
                  rows={3}
                  className="w-full mt-1 rounded-lg border border-[#e8d8d8] px-3 py-2 text-sm font-mono"
                />
              ) : (
                <input
                  value={settings[key(method.id, f)] || ''}
                  onChange={(e) => set(key(method.id, f), e.target.value)}
                  className="w-full mt-1 rounded-lg border border-[#e8d8d8] px-3 py-2 text-sm font-mono"
                  placeholder={f.includes('key') || f.includes('secret') ? '••••••••' : ''}
                />
              )}
            </div>
          ))}

          <div className="border-t border-[#f0e0e0] pt-4 space-y-3">
            <p className="text-xs font-semibold text-[#6b5555] uppercase">Deposit limits</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#6b5555]">Min amount (USD)</label>
                <input
                  value={settings[`pay_${method.id}_min`] || '5'}
                  onChange={(e) => set(`pay_${method.id}_min`, e.target.value)}
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#6b5555]">Max amount (USD)</label>
                <input
                  value={settings[`pay_${method.id}_max`] || '5000'}
                  onChange={(e) => set(`pay_${method.id}_max`, e.target.value)}
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6b5555]">Fee %</label>
              <input
                value={settings[`pay_${method.id}_fee`] || '0'}
                onChange={(e) => set(`pay_${method.id}_fee`, e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          {msg && (
            <p className={`text-sm ${msg.includes('saved') ? 'text-emerald-700' : 'text-red-600'}`}>
              {msg}
            </p>
          )}
          {errDetail && (
            <pre className="text-[11px] bg-red-50 border border-red-100 rounded-lg p-3 whitespace-pre-wrap text-red-800">
              {errDetail}
            </pre>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-[#8b1a1a] to-[#4a0e0e] px-5 py-2.5 text-sm text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save payment settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
