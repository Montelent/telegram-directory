import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().optional(),
})

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
    const body = schema.parse(await req.json())
    const deposit = await prisma.deposit.findUnique({ where: { id } })
    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
    }
    if (deposit.status !== 'pending') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 })
    }

    if (body.action === 'reject') {
      await prisma.deposit.update({
        where: { id },
        data: {
          status: 'rejected',
          metadata: JSON.stringify({
            ...(safeParse(deposit.metadata) || {}),
            adminNote: body.note || null,
            rejectedAt: new Date().toISOString(),
          }),
        },
      })
      return NextResponse.json({ ok: true, status: 'rejected' })
    }

    // Approve: credit user balance
    await prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id },
        data: {
          status: 'completed',
          metadata: JSON.stringify({
            ...(safeParse(deposit.metadata) || {}),
            adminNote: body.note || null,
            approvedAt: new Date().toISOString(),
            approvedBy: (session.user as any)?.email || 'admin',
          }),
        },
      })
      await tx.user.update({
        where: { id: deposit.userId },
        data: {
          balanceCents: { increment: deposit.amountCents },
        },
      })
    })

    return NextResponse.json({ ok: true, status: 'completed', creditedCents: deposit.amountCents })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

function safeParse(s: string | null) {
  if (!s) return null
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}
