import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSiteSettings } from '@/lib/site-settings'
import { sendMail, reportNotifyEmailHtml } from '@/lib/mail'

const schema = z.object({
  entityId: z.string().min(1),
  reason: z.string().min(1).max(50),
  title: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())

    let report: any
    try {
      report = await prisma.report.create({
        data: {
          entityId: body.entityId,
          reason: body.reason,
          title: body.title || null,
          status: 'open',
        },
      })
    } catch {
      // Fallback to site_settings if reports table not migrated yet
      const { randomBytes } = await import('crypto')
      const id = randomBytes(10).toString('hex')
      await prisma.siteSetting.create({
        data: {
          id: randomBytes(12).toString('hex'),
          key: `report:${id}`,
          value: JSON.stringify({
            id,
            entityId: body.entityId,
            reason: body.reason,
            title: body.title || null,
            createdAt: new Date().toISOString(),
            status: 'open',
          }),
        },
      })
      report = { id }
    }

    // Optional admin notification email
    try {
      const settings = await getSiteSettings()
      if (settings.mail_notify_reports === '1' && settings.mail_admin_notify) {
        const siteName = settings.site_name || 'Telegram Directory'
        await sendMail({
          to: settings.mail_admin_notify,
          subject: `[${siteName}] Report: ${body.reason}`,
          html: reportNotifyEmailHtml(
            siteName,
            body.title || body.entityId,
            body.reason,
            body.entityId
          ),
        })
      }
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({ ok: true, id: report.id })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error('report', e)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ reports })
  } catch {
    try {
      const rows = await prisma.siteSetting.findMany({
        where: { key: { startsWith: 'report:' } },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      })
      const reports = rows
        .map((r) => {
          try {
            return JSON.parse(r.value)
          } catch {
            return null
          }
        })
        .filter(Boolean)
      return NextResponse.json({ reports })
    } catch {
      return NextResponse.json({ reports: [] })
    }
  }
}
