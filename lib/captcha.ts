import { createHash, randomInt } from 'crypto'
import { getSiteSettings } from './site-settings'

const SECRET = process.env.NEXTAUTH_SECRET || 'captcha-secret'

export function createCustomCaptcha(): { question: string; token: string } {
  const a = randomInt(2, 12)
  const b = randomInt(1, 10)
  const answer = String(a + b)
  const exp = Date.now() + 10 * 60 * 1000
  const payload = `${answer}|${exp}`
  const sig = createHash('sha256').update(payload + SECRET).digest('hex').slice(0, 16)
  return {
    question: `What is ${a} + ${b}?`,
    token: Buffer.from(`${payload}|${sig}`).toString('base64url'),
  }
}

export function verifyCustomCaptcha(token: string, answer: string): boolean {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8')
    const [expected, expStr, sig] = raw.split('|')
    const exp = parseInt(expStr, 10)
    if (!expected || !sig || Number.isNaN(exp) || Date.now() > exp) return false
    const check = createHash('sha256')
      .update(`${expected}|${expStr}` + SECRET)
      .digest('hex')
      .slice(0, 16)
    if (check !== sig) return false
    return String(answer).trim() === expected
  } catch {
    return false
  }
}

export async function verifyGoogleRecaptcha(responseToken: string): Promise<boolean> {
  const settings = await getSiteSettings()
  const secret = settings.captcha_google_secret
  if (!secret || !responseToken) return false
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: responseToken,
      }),
    })
    const data = await res.json()
    return !!data.success
  } catch {
    return false
  }
}

/** Returns captcha mode from settings: off | custom | google */
export async function getCaptchaMode(): Promise<'off' | 'custom' | 'google'> {
  const s = await getSiteSettings()
  const mode = (s.captcha_mode || 'custom').toLowerCase()
  if (mode === 'google' || mode === 'off' || mode === 'custom') return mode
  return 'custom'
}
