import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const schema = z.object({
  entityId: z.string().min(1),
  reason: z.string().min(1).max(50),
  title: z.string().optional(),
})

/** Store reports in site_settings as report:{id} JSON for admin review */
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const id = randomBytes(10).toString('hex')
    const key = `report:${id}`
    const value = JSON.stringify({
      id,
      entityId: body.entityId,
      reason: body.reason,
      title: body.title || null,
      createdAt: new Date().toISOString(),
      status: 'open',
    })

    await prisma.siteSetting.create({
      data: { id: randomBytes(12).toString('hex'), key, value },
    })

    return NextResponse.json({ ok: true, id })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error('report', e)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}

export async function GET() {
  // Admin list of open reports
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
