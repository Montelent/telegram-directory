import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCaptchaMode, verifyCustomCaptcha, verifyGoogleRecaptcha } from '@/lib/captcha'
import { getSiteSettings, setSiteSetting } from '@/lib/site-settings'
import { sendMail, verificationEmailHtml } from '@/lib/mail'
import { randomInt } from 'crypto'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().max(100).optional(),
  captchaToken: z.string().optional(),
  captchaAnswer: z.string().optional(),
  recaptchaToken: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const mode = await getCaptchaMode()
    if (mode === 'custom') {
      if (!data.captchaToken || !data.captchaAnswer) {
        return NextResponse.json({ error: 'Please solve the captcha' }, { status: 400 })
      }
      if (!verifyCustomCaptcha(data.captchaToken, data.captchaAnswer)) {
        return NextResponse.json({ error: 'Captcha incorrect or expired' }, { status: 400 })
      }
    } else if (mode === 'google') {
      if (!data.recaptchaToken) {
        return NextResponse.json({ error: 'Please complete the captcha' }, { status: 400 })
      }
      const ok = await verifyGoogleRecaptcha(data.recaptchaToken)
      if (!ok) return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const settings = await getSiteSettings()
    const requireVerify = settings.signup_require_verify !== '0'
    const hashed = await hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashed,
        name: data.name || null,
        emailVerified: !requireVerify,
      } as any,
    })

    if (requireVerify) {
      const code = String(randomInt(100000, 999999))
      const exp = Date.now() + 30 * 60 * 1000
      await setSiteSetting(
        `verify_code:${data.email.toLowerCase()}`,
        JSON.stringify({ code, exp })
      )
      const siteName = settings.site_name || 'Telegram Directory'
      await sendMail({
        to: data.email.toLowerCase(),
        subject: `[${siteName}] Your verification code`,
        html: verificationEmailHtml(siteName, code),
      })
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        requiresVerification: requireVerify,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
