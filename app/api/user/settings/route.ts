import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const prefsSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional().or(z.literal('')),
  notifications: z
    .object({
      comments: z.boolean().optional(),
      mediaApproved: z.boolean().optional(),
      mediaRejected: z.boolean().optional(),
      mediaDeactivated: z.boolean().optional(),
      mediaFeatured: z.boolean().optional(),
      adCampaigns: z.boolean().optional(),
      visitMilestones: z.boolean().optional(),
    })
    .optional(),
})

function prefsKey(userId: string) {
  return `user_prefs:${userId}`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let notifications = {
    comments: true,
    mediaApproved: true,
    mediaRejected: true,
    mediaDeactivated: false,
    mediaFeatured: true,
    adCampaigns: true,
    visitMilestones: false,
  }

  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: prefsKey(userId) } })
    if (row?.value) {
      const parsed = JSON.parse(row.value)
      if (parsed.notifications) notifications = { ...notifications, ...parsed.notifications }
    }
  } catch {
    /* */
  }

  return NextResponse.json({ user, notifications })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  try {
    const body = prefsSchema.parse(await req.json())

    const data: { name?: string; email?: string; password?: string } = {}
    if (body.name !== undefined) data.name = body.name.trim()
    if (body.email) {
      const taken = await prisma.user.findFirst({
        where: { email: body.email.toLowerCase(), id: { not: userId } },
      })
      if (taken) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
      data.email = body.email.toLowerCase()
    }
    if (body.password && body.password.length >= 6) {
      data.password = await bcrypt.hash(body.password, 10)
    }

    if (Object.keys(data).length) {
      await prisma.user.update({ where: { id: userId }, data })
    }

    if (body.notifications) {
      const key = prefsKey(userId)
      let existing: any = {}
      try {
        const row = await prisma.siteSetting.findUnique({ where: { key } })
        if (row?.value) existing = JSON.parse(row.value)
      } catch {
        /* */
      }
      const value = JSON.stringify({
        ...existing,
        notifications: { ...existing.notifications, ...body.notifications },
      })
      await prisma.siteSetting.upsert({
        where: { key },
        create: { id: randomBytes(12).toString('hex'), key, value },
        update: { value },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string

  try {
    await prisma.user.delete({ where: { id: userId } })
    try {
      await prisma.siteSetting.delete({ where: { key: prefsKey(userId) } })
    } catch {
      /* */
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Could not delete account' }, { status: 500 })
  }
}
