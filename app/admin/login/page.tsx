'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      type: 'admin',
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password. Use ADMIN_EMAIL / ADMIN_PASSWORD from Vercel.')
      return
    }

    // Prefer same-origin /admin — ignore cross-deployment callback URLs
    let target = '/admin'
    const cb = searchParams.get('callbackUrl')
    if (cb) {
      try {
        const u = new URL(cb, window.location.origin)
        if (u.origin === window.location.origin && u.pathname.startsWith('/admin')) {
          target = u.pathname + u.search
        }
      } catch {
        /* keep /admin */
      }
    }

    router.push(target)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf4f4] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#f0e0e0] shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center text-[#2d0808] mb-2">Admin Login</h1>
        <p className="text-xs text-center text-[#6b5555] mb-6 break-all">
          Host: {typeof window !== 'undefined' ? window.location.host : '…'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a]/40"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#8b1a1a] to-[#4a0e0e] px-4 py-2.5 text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-slate-500">
          Always open admin from your production URL only (e.g. telegram-directory-umber.vercel.app).
          Set NEXTAUTH_URL to that same URL in Vercel.
        </p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
      <AdminLoginForm />
    </Suspense>
  )
}
