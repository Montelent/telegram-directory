import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getSiteSettings, setSiteSetting } from '@/lib/site-settings'
import { sendMail } from '@/lib/mail'

const KEYS = [
  'mail_provider',
  'mail_from',
  'mail_from_name',
  'mail_smtp_host',
  'mail_smtp_port',
  'mail_smtp_user',
  'mail_smtp_pass',
  'mail_smtp_secure',
  'mail_resend_api_key',
  'mail_notify_reports',
  'mail_admin_notify',
  'captcha_mode',
  'captcha_google_site_key',
  'captcha_google_secret',
  'signup_require_verify',
] as const

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const all = await getSiteSettings()
  const settings: Record<string, string> = {}
  for (const k of KEYS) settings[k] = all[k] || ''
  // Never expose full secrets in UI beyond masking hint
  if (settings.mail_smtp_pass) settings.mail_smtp_pass_set = '1'
  if (settings.mail_resend_api_key) settings.mail_resend_api_key_set = '1'
  if (settings.captcha_google_secret) settings.captcha_google_secret_set = '1'
  return NextResponse.json({ settings })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const body = await req.json()
    const incoming = body.settings || body
    for (const k of KEYS) {
      if (incoming[k] !== undefined && incoming[k] !== null) {
        // Skip blanking secrets if UI sends empty while already set
        if (
          (k === 'mail_smtp_pass' || k === 'mail_resend_api_key' || k === 'captcha_google_secret') &&
          String(incoming[k]) === ''
        ) {
          continue
        }
        await setSiteSetting(k, String(incoming[k]))
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  // Test send
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const { to } = await req.json()
    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Provide a test recipient email' }, { status: 400 })
    }
    const settings = await getSiteSettings()
    const siteName = settings.site_name || 'Telegram Directory'
    const result = await sendMail({
      to,
      subject: `[${siteName}] Test email`,
      html: `<p>This is a test email from <strong>${siteName}</strong>.</p><p>Your mail provider is working.</p>`,
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Test failed' }, { status: 500 })
  }
}
