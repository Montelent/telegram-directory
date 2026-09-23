import { NextResponse } from 'next/server'
import { createCustomCaptcha, getCaptchaMode } from '@/lib/captcha'
import { getSiteSettings } from '@/lib/site-settings'

export async function GET() {
  const mode = await getCaptchaMode()
  if (mode === 'off') return NextResponse.json({ mode: 'off' })
  if (mode === 'google') {
    const s = await getSiteSettings()
    return NextResponse.json({
      mode: 'google',
      siteKey: s.captcha_google_site_key || '',
    })
  }
  const captcha = createCustomCaptcha()
  return NextResponse.json({ mode: 'custom', question: captcha.question, token: captcha.token })
}
