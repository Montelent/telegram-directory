import { getSiteSettings } from './site-settings'

export type PaymentMethodId =
  | 'paypal'
  | 'paystack'
  | 'flutterwave'
  | 'monnify'
  | 'bank_transfer'
  | 'usdt'
  | 'usdc'
  | 'btc'
  | 'bnb'
  | 'tron'

export const PAYMENT_METHOD_META: {
  id: PaymentMethodId
  label: string
  kind: 'gateway' | 'bank' | 'crypto'
}[] = [
  { id: 'paypal', label: 'PayPal', kind: 'gateway' },
  { id: 'paystack', label: 'Paystack', kind: 'gateway' },
  { id: 'flutterwave', label: 'Flutterwave', kind: 'gateway' },
  { id: 'monnify', label: 'Monnify', kind: 'gateway' },
  { id: 'bank_transfer', label: 'Bank Transfer', kind: 'bank' },
  { id: 'usdt', label: 'USDT', kind: 'crypto' },
  { id: 'usdc', label: 'USDC', kind: 'crypto' },
  { id: 'btc', label: 'Bitcoin (BTC)', kind: 'crypto' },
  { id: 'bnb', label: 'BNB', kind: 'crypto' },
  { id: 'tron', label: 'TRON (TRX)', kind: 'crypto' },
]

export type EnabledMethod = {
  id: PaymentMethodId
  label: string
  kind: 'gateway' | 'bank' | 'crypto'
  min: number
  max: number
  fee: number
  details: Record<string, string>
}

export async function getEnabledPaymentMethods(): Promise<EnabledMethod[]> {
  const s = await getSiteSettings()
  const list: EnabledMethod[] = []

  for (const m of PAYMENT_METHOD_META) {
    if (s[`pay_${m.id}_enabled`] !== '1') continue

    const min = parseFloat(s[`pay_${m.id}_min`] || '5') || 5
    const max = parseFloat(s[`pay_${m.id}_max`] || '5000') || 5000
    const fee = parseFloat(s[`pay_${m.id}_fee`] || '0') || 0

    const details: Record<string, string> = {}
    const fieldKeys = Object.keys(s).filter((k) => k.startsWith(`pay_${m.id}_`) && !['enabled', 'min', 'max', 'fee'].some((x) => k.endsWith(`_${x}`)))
    // Explicit fields per method
    const known = [
      'client_id',
      'secret',
      'mode',
      'public_key',
      'secret_key',
      'encryption_key',
      'api_key',
      'contract_code',
      'bank_name',
      'account_name',
      'account_number',
      'instructions',
      'network',
      'wallet_address',
      'memo',
    ]
    for (const f of known) {
      const v = s[`pay_${m.id}_${f}`]
      if (v) details[f] = v
    }
    // Don't expose secrets to the client in public API — strip sensitive
    delete details.secret
    delete details.secret_key
    delete details.encryption_key
    delete details.api_key

    list.push({
      id: m.id,
      label: m.label,
      kind: m.kind,
      min,
      max,
      fee,
      details,
    })
  }

  return list
}
