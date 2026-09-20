'use client'

import { useEffect, useState } from 'react'

interface UserRow {
  id: string
  email: string
  name: string | null
  isActive: boolean
  balanceCents: number
  createdAt: string
  _count?: { media: number; submissions: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

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
      setMsg(data.error || 'Failed')
      return
    }
    setEmail('')
    setName('')
    setPassword('')
    setMsg('User created.')
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

  async function setBalance(id: string) {
    const raw = prompt('Balance in USD (e.g. 10.50)')
    if (raw == null) return
    const dollars = parseFloat(raw)
    if (Number.isNaN(dollars)) return
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balanceCents: Math.round(dollars * 100) }),
    })
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Users</h1>

      <form onSubmit={createUser} className="bg-white rounded-xl border p-4 mb-6 grid sm:grid-cols-4 gap-2">
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
        <button type="submit" className="rounded-lg bg-blue-600 text-white text-sm font-medium px-3 py-2">
          Add user
        </button>
      </form>
      {msg && <p className="text-sm text-slate-600 mb-4">{msg}</p>}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500 text-sm">No users yet.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
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
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.name || '—'}</td>
                  <td className="px-4 py-3">${((u.balanceCents || 0) / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.isActive !== false ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => setBalance(u.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Balance
                    </button>
                    <button
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
    </div>
  )
}
