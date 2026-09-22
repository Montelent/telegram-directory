'use client'

import { useEffect, useState } from 'react'

interface UserRow {
  id: string
  email: string
  name: string | null
  isActive: boolean
  balanceCents: number
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const [edit, setEdit] = useState<UserRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [adjustUsd, setAdjustUsd] = useState('')
  const [setUsd, setSetUsd] = useState('')
  const [saving, setSaving] = useState(false)
  const [editMsg, setEditMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openEdit(u: UserRow) {
    setEdit(u)
    setEditName(u.name || '')
    setEditEmail(u.email)
    setEditPassword('')
    setEditActive(u.isActive !== false)
    setAdjustUsd('')
    setSetUsd(((u.balanceCents || 0) / 100).toFixed(2))
    setEditMsg('')
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMsg(typeof data.error === 'string' ? data.error : 'Failed')
      return
    }
    setEmail('')
    setName('')
    setPassword('')
    setMsg('User created.')
    load()
  }

  async function saveEdit() {
    if (!edit) return
    setSaving(true)
    setEditMsg('')
    try {
      const payload: Record<string, unknown> = {
        name: editName,
        email: editEmail,
        isActive: editActive,
      }
      if (editPassword.trim().length >= 6) payload.password = editPassword.trim()

      if (setUsd !== '') {
        const dollars = parseFloat(setUsd)
        if (!Number.isNaN(dollars)) payload.balanceCents = Math.round(dollars * 100)
      }

      const res = await fetch(`/api/admin/users/${edit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setEditMsg(typeof data.error === 'string' ? data.error : 'Save failed')
        setSaving(false)
        return
      }

      if (adjustUsd !== '') {
        const adj = parseFloat(adjustUsd)
        if (!Number.isNaN(adj) && adj !== 0) {
          await fetch(`/api/admin/users/${edit.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balanceAdjustUsd: adj }),
          })
        }
      }

      setEdit(null)
      load()
    } catch {
      setEditMsg('Network error')
    }
    setSaving(false)
  }

  async function quickAdjust(id: string, deltaUsd: number) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balanceAdjustUsd: deltaUsd }),
    })
    load()
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    load()
  }

  async function deleteUser(id: string) {
    if (!window.confirm('Delete this user permanently?')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setEdit(null)
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-[#2d0808] mb-1">Users</h1>
      <p className="text-sm text-[#6b5555] mb-6">
        Create users, edit profile & password, top up or subtract balance, activate / deactivate.
      </p>

      <form
        onSubmit={createUser}
        className="bg-white rounded-xl border border-[#f0e0e0] p-4 mb-6 grid sm:grid-cols-4 gap-2"
      >
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6)"
          type="password"
          required
          minLength={6}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#8b1a1a] text-white text-sm font-medium px-3 py-2"
        >
          Add user
        </button>
      </form>
      {msg && <p className="text-sm text-slate-600 mb-4">{msg}</p>}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500 text-sm">No users yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#f0e0e0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#faf4f4] border-b border-[#f0e0e0]">
              <tr>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Balance</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 border-[#f5f0f0]">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.name || '—'}</td>
                  <td className="px-4 py-3 font-medium">
                    ${((u.balanceCents || 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${\n                        u.isActive !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.isActive !== false ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="text-xs font-medium text-[#8b1a1a] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => quickAdjust(u.id, 10)}
                      className="text-xs text-emerald-700 hover:underline"
                      title="Add $10"
                    >
                      +$10
                    </button>
                    <button
                      type="button"
                      onClick={() => quickAdjust(u.id, -10)}
                      className="text-xs text-amber-700 hover:underline"
                      title="Subtract $10"
                    >
                      −$10
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(u.id, u.isActive !== false)}
                      className="text-xs text-slate-600 hover:underline"
                    >
                      {u.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-[#2d0808]">Edit user</h2>
              <button type="button" onClick={() => setEdit(null)} className="text-slate-400 text-xl">
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">Full name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">New password</label>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Set balance (USD)</label>
                <input
                  value={setUsd}
                  onChange={(e) => setSetUsd(e.target.value)}
                  placeholder="0.00"
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Adjust (± USD)</label>
                <input
                  value={adjustUsd}
                  onChange={(e) => setAdjustUsd(e.target.value)}
                  placeholder="e.g. 25 or -5"
                  className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Current: ${((edit.balanceCents || 0) / 100).toFixed(2)}. Set replaces balance; Adjust
              adds/subtracts after set.
            </p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
              Account active
            </label>

            {editMsg && <p className="text-sm text-slate-600">{editMsg}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={saving}
                onClick={saveEdit}
                className="rounded-lg bg-[#8b1a1a] text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="rounded-lg border text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteUser(edit.id)}
                className="rounded-lg bg-red-600 text-white text-sm px-4 py-2 ml-auto"
              >
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
