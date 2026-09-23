import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSiteSettings, setSiteSetting } from '@/lib/site-settings'
import { sendMail, verificationEmailHtml } from '@/lib/mail'
import { randomInt } from 'crypto'
import { z } from 'zod'

function codeKey(email: string) {
  return `verify_code:${email.toLowerCase()}`
}

export async function POST(req: NextRequest) {
  // Send or resend code
  try {
    const { email } = z.object({ email: z.string().email() }).parse(await req.json())
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    if ((user as any).emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }
    const code = String(randomInt(100000, 999999))
    const exp = Date.now() + 30 * 60 * 1000
    await setSiteSetting(codeKey(email), JSON.stringify({ code, exp }))

    const settings = await getSiteSettings()
    const siteName = settings.site_name || 'Telegram Directory'
    const base = settings.seo_canonical_base || ''
    const result = await sendMail({
      to: email.toLowerCase(),
      subject: `[${siteName}] Your verification code`,
      html: verificationEmailHtml(siteName, code, base ? `${base}/verify-email` : undefined),
    })
    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Could not send email' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  // Confirm code
  try {
    const { email, code } = z
      .object({ email: z.string().email(), code: z.string().min(4).max(12) })
      .parse(await req.json())
    const settings = await getSiteSettings()
    const raw = settings[codeKey(email)]
    if (!raw) return NextResponse.json({ error: 'Code expired or not found' }, { status: 400 })
    let parsed: { code: string; exp: number }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Invalid code state' }, { status: 400 })
    }
    if (Date.now() > parsed.exp) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 })
    }
    if (String(code).trim() !== parsed.code) {
      return NextResponse.json({ error: 'Incorrect code' }, { status: 400 })
    }
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { emailVerified: true } as any,
    })
    await setSiteSetting(codeKey(email), '')
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
