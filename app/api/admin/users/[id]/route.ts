import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  isActive: z.boolean().optional(),
  /** Set absolute balance in cents */
  balanceCents: z.number().int().optional(),
  /** Add or subtract dollars (e.g. 10 or -5) → converted to cents */
  balanceAdjustUsd: z.number().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      balanceCents: true,
      createdAt: true,
      _count: { select: { media: true, submissions: true, deposits: true } },
    },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = patchSchema.parse(await req.json())
    const data: any = {}

    if (body.name !== undefined) data.name = body.name
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive

    if (body.email) {
      const taken = await prisma.user.findFirst({
        where: { email: body.email.toLowerCase(), id: { not: id } },
      })
      if (taken) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
      data.email = body.email.toLowerCase()
    }

    if (body.password) {
      data.password = await hash(body.password, 12)
    }

    if (typeof body.balanceCents === 'number') {
      data.balanceCents = Math.max(0, body.balanceCents)
    } else if (typeof body.balanceAdjustUsd === 'number') {
      const delta = Math.round(body.balanceAdjustUsd * 100)
      const current = await prisma.user.findUnique({ where: { id }, select: { balanceCents: true } })
      if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      data.balanceCents = Math.max(0, (current.balanceCents || 0) + delta)
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        balanceCents: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
