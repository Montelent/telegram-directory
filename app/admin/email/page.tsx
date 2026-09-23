'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminEmailPage() {
  const [v, setV] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/email')
      .then((r) => r.json())
      .then((d) => setV(d.settings || {}))
      .finally(() => setLoading(false))
  }, [])

  function set(key: string, value: string) {
    setV((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/admin/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: v }),
    })
    setSaving(false)
    setMsg(res.ok ? 'Saved.' : 'Save failed')
  }

  async function testSend() {
    setTesting(true)
    setMsg('')
    const res = await fetch('/api/admin/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: testTo }),
    })
    const data = await res.json()
    setTesting(false)
    setMsg(res.ok ? 'Test email sent.' : data.error || 'Test failed')
  }

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>

  const provider = v.mail_provider || 'log'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <Link href="/admin/settings" className="text-xs text-slate-500 hover:underline">
        ← Settings
      </Link>
      <h1 className="text-xl sm:text-2xl font-bold mt-1 mb-1">Email & Captcha</h1>
      <p className="text-sm text-slate-500 mb-6">
        SMTP / Resend mail, signup verification, and captcha
      </p>

      <div className="bg-white rounded-xl border p-5 space-y-5">
        <div>
          <h2 className="font-semibold text-sm mb-2">Mail provider</h2>
          <select
            value={provider}
            onChange={(e) => set('mail_provider', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="log">Log only (dev — no real send)</option>
            <option value="smtp">Custom SMTP (Gmail, Mailgun, Thundermail, PHP relay…)</option>
            <option value="resend">Resend API</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">From email</label>
            <input
              value={v.mail_from || ''}
              onChange={(e) => set('mail_from', e.target.value)}
              placeholder="noreply@yourdomain.com"
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">From name</label>
            <input
              value={v.mail_from_name || ''}
              onChange={(e) => set('mail_from_name', e.target.value)}
              placeholder="Telegram Directory"
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>

        {provider === 'smtp' && (
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">SMTP settings</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Host</label>
                <input
                  value={v.mail_smtp_host || ''}
                  onChange={(e) => set('mail_smtp_host', e.target.value)}
                  placeholder="smtp.example.com"
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Port</label>
                <input
                  value={v.mail_smtp_port || '587'}
                  onChange={(e) => set('mail_smtp_port', e.target.value)}
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Username</label>
                <input
                  value={v.mail_smtp_user || ''}
                  onChange={(e) => set('mail_smtp_user', e.target.value)}
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Password</label>
                <input
                  type="password"
                  value={v.mail_smtp_pass || ''}
                  onChange={(e) => set('mail_smtp_pass', e.target.value)}
                  placeholder={v.mail_smtp_pass_set === '1' ? '•••••••• (saved)' : ''}
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={v.mail_smtp_secure === '1'}
                onChange={(e) => set('mail_smtp_secure', e.target.checked ? '1' : '0')}
              />
              Use TLS/SSL (port 465)
            </label>
          </div>
        )}

        {provider === 'resend' && (
          <div className="border-t pt-4">
            <label className="text-xs font-medium">Resend API key</label>
            <input
              type="password"
              value={v.mail_resend_api_key || ''}
              onChange={(e) => set('mail_resend_api_key', e.target.value)}
              placeholder={v.mail_resend_api_key_set === '1' ? '•••••••• (saved)' : 're_…'}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-semibold">Signup</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.signup_require_verify !== '0'}
              onChange={(e) => set('signup_require_verify', e.target.checked ? '1' : '0')}
            />
            Require email verification code on registration
          </label>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-semibold">Captcha</h3>
          <select
            value={v.captcha_mode || 'custom'}
            onChange={(e) => set('captcha_mode', e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="off">Off</option>
            <option value="custom">Custom (math question)</option>
            <option value="google">Google reCAPTCHA v2</option>
          </select>
          {(v.captcha_mode || 'custom') === 'google' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Site key</label>
                <input
                  value={v.captcha_google_site_key || ''}
                  onChange={(e) => set('captcha_google_site_key', e.target.value)}
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Secret key</label>
                <input
                  type="password"
                  value={v.captcha_google_secret || ''}
                  onChange={(e) => set('captcha_google_secret', e.target.value)}
                  placeholder={v.captcha_google_secret_set === '1' ? '•••••••• (saved)' : ''}
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.mail_notify_reports === '1'}
              onChange={(e) => set('mail_notify_reports', e.target.checked ? '1' : '0')}
            />
            Email admin when users report media
          </label>
          <div>
            <label className="text-xs font-medium">Admin notify email</label>
            <input
              value={v.mail_admin_notify || ''}
              onChange={(e) => set('mail_admin_notify', e.target.value)}
              placeholder="admin@yourdomain.com"
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <h3 className="text-sm font-semibold">Test send</h3>
          <div className="flex gap-2">
            <input
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={testSend}
              disabled={testing || !testTo}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {testing ? 'Sending…' : 'Send test'}
            </button>
          </div>
        </div>

        {msg && <p className="text-sm text-slate-600">{msg}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
