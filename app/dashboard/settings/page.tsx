'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'

type Notifs = {
  comments: boolean
  mediaApproved: boolean
  mediaRejected: boolean
  mediaDeactivated: boolean
  mediaFeatured: boolean
  adCampaigns: boolean
  visitMilestones: boolean
}

const NOTIF_ROWS: { key: keyof Notifs; label: string; desc: string }[] = [
  { key: 'comments', label: 'Comments', desc: 'Inbox immediately, email once a day' },
  { key: 'mediaApproved', label: 'Media approved', desc: 'When a listing goes live' },
  { key: 'mediaRejected', label: 'Media rejected', desc: 'When a listing is declined' },
  { key: 'mediaDeactivated', label: 'Media deactivated', desc: 'When a listing is taken down' },
  { key: 'mediaFeatured', label: 'Media featured', desc: 'When featuring starts or ends' },
  { key: 'adCampaigns', label: 'Ad campaigns', desc: 'Budget, queue, and campaign updates' },
  { key: 'visitMilestones', label: 'Visit milestones', desc: 'When your media hits visit goals' },
]

export default function DashboardSettingsPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notifs, setNotifs] = useState<Notifs>({
    comments: true,
    mediaApproved: true,
    mediaRejected: true,
    mediaDeactivated: false,
    mediaFeatured: true,
    adCampaigns: true,
    visitMilestones: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/user/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setName(d.user.name || '')
          setEmail(d.user.email || '')
        }
        if (d.notifications) setNotifs((n) => ({ ...n, ...d.notifications }))
      })
      .finally(() => setLoading(false))
  }, [])

  function toggle(key: keyof Notifs) {
    setNotifs((n) => ({ ...n, [key]: !n[key] }))
  }

  async function save() {
    setErr('')
    setMsg('')
    if (password && password !== confirmPassword) {
      setErr('Passwords do not match')
      return
    }
    if (password && password.length < 6) {
      setErr('Password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password: password || '',
          notifications: notifs,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Update failed')
      } else {
        setMsg('Settings updated.')
        setPassword('')
        setConfirmPassword('')
      }
    } catch {
      setErr('Network error')
    }
    setSaving(false)
  }

  async function deleteAccount() {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return
    if (!window.confirm('Are you sure? All your data will be removed.')) return
    try {
      const res = await fetch('/api/user/settings', { method: 'DELETE' })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      } else {
        const data = await res.json()
        window.alert(data.error || 'Delete failed')
      }
    } catch {
      window.alert('Network error')
    }
  }

  if (loading) {
    return <p className="text-slate-500 text-sm py-8">Loading settings…</p>
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        <span className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">⚙</span>
        Settings
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-500 -mt-2">Profile, notifications, and account.</p>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">👤</span>
          <div>
            <p className="font-semibold text-slate-900">Profile</p>
            <p className="text-xs text-slate-400">Name, email, and password</p>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50"
          />
          <p className="text-[11px] text-slate-400 mt-1">Leave it empty if you don't want to change it.</p>
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="confirm password"
            className="w-full mt-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50"
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">🔔</span>
          <div>
            <p className="font-semibold text-slate-900">Notifications</p>
            <p className="text-xs text-slate-400">Choose what you want to hear about</p>
          </div>
        </div>

        {NOTIF_ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-3 py-3 border-t border-slate-50 first:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{row.label}</p>
              <p className="text-xs text-slate-400">{row.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifs[row.key]}
              onClick={() => toggle(row.key)}
              className={`relative w-11 h-6 rounded-full transition shrink-0 ${
                notifs[row.key] ? 'bg-[#1a2332]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition ${
                  notifs[row.key] ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        ))}
      </section>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full sm:w-auto rounded-xl bg-[#1a2332] hover:bg-[#0f1620] text-white font-semibold px-8 py-3 text-sm disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Update'}
      </button>

      <section className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-lg">🗑</span>
          <p className="font-semibold text-slate-900">Delete your account</p>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Permanent — this cannot be undone. If you want to delete all your data permanently from our
          website you can press the button below. Once you delete your account, the account can not be
          recovered at all.
        </p>
        <button
          type="button"
          onClick={deleteAccount}
          className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 text-sm"
        >
          Delete
        </button>
      </section>
    </div>
  )
}
