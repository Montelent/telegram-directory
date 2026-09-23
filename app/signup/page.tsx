'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [verifyCode, setVerifyCode] = useState('')
  const [captchaMode, setCaptchaMode] = useState<'off' | 'custom' | 'google'>('custom')
  const [captchaQuestion, setCaptchaQuestion] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [googleSiteKey, setGoogleSiteKey] = useState('')
  const recaptchaRef = useRef<HTMLDivElement>(null)

  async function loadCaptcha() {
    try {
      const res = await fetch('/api/captcha')
      const data = await res.json()
      setCaptchaMode(data.mode || 'off')
      if (data.mode === 'custom') {
        setCaptchaQuestion(data.question || '')
        setCaptchaToken(data.token || '')
        setCaptchaAnswer('')
      }
      if (data.mode === 'google') {
        setGoogleSiteKey(data.siteKey || '')
      }
    } catch {
      /* */
    }
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  useEffect(() => {
    if (captchaMode !== 'google' || !googleSiteKey) return
    const existing = document.querySelector('script[data-recaptcha]')
    if (!existing) {
      const s = document.createElement('script')
      s.src = 'https://www.google.com/recaptcha/api.js'
      s.async = true
      s.defer = true
      s.setAttribute('data-recaptcha', '1')
      document.body.appendChild(s)
    }
  }, [captchaMode, googleSiteKey])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let recaptchaToken = ''
    if (captchaMode === 'google' && typeof window !== 'undefined' && (window as any).grecaptcha) {
      recaptchaToken = (window as any).grecaptcha.getResponse() || ''
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          captchaToken,
          captchaAnswer,
          recaptchaToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Signup failed')
        setLoading(false)
        loadCaptcha()
        return
      }

      if (data.requiresVerification) {
        setStep('verify')
        setLoading(false)
        return
      }

      const result = await signIn('credentials', {
        email,
        password,
        type: 'user',
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but login failed. Please log in.')
        setLoading(false)
        router.push('/login')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verifyCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setLoading(false)
        return
      }
      const result = await signIn('credentials', {
        email,
        password,
        type: 'user',
        redirect: false,
      })
      if (result?.error) {
        router.push('/login')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  async function resendCode() {
    setError('')
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not resend')
    else setError('')
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          {step === 'form' ? 'Create account' : 'Verify your email'}
        </h1>

        {step === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-slate-600 text-center">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Verification code</label>
              <input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                required
                maxLength={8}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>
            <button type="button" onClick={resendCode} className="w-full text-sm text-blue-600 hover:underline">
              Resend code
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password (min 6 chars)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {captchaMode === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Captcha: {captchaQuestion}
                </label>
                <div className="flex gap-2">
                  <input
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    required
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Answer"
                  />
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    className="rounded-lg border px-3 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    ↻
                  </button>
                </div>
              </div>
            )}

            {captchaMode === 'google' && googleSiteKey && (
              <div ref={recaptchaRef} className="g-recaptcha" data-sitekey={googleSiteKey} />
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Sign up'}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-center text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
