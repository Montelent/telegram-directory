import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEnabledPaymentMethods } from '@/lib/payments'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const schema = z.object({
  method: z.string().min(1),
  amountUsd: z.number().positive(),
  promoCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  try {
    const body = schema.parse(await req.json())
    const methods = await getEnabledPaymentMethods()
    const method = methods.find((m) => m.id === body.method)

    if (!method) {
      return NextResponse.json({ error: 'Payment method not available' }, { status: 400 })
    }

    if (body.amountUsd < method.min || body.amountUsd > method.max) {
      return NextResponse.json(
        { error: `Amount must be between $${method.min} and $${method.max}` },
        { status: 400 }
      )
    }

    let creditUsd = body.amountUsd
    if (body.promoCode?.toUpperCase() === 'FIRSTDEPOSIT') {
      creditUsd = body.amountUsd * 1.1
    }

    // Apply fee on amount charged (info only for manual)
    const fee = method.fee || 0
    const chargeUsd = body.amountUsd * (1 + fee / 100)

    const reference = `DEP-${randomBytes(6).toString('hex').toUpperCase()}`

    const deposit = await prisma.deposit.create({
      data: {
        id: randomBytes(12).toString('hex'),
        userId,
        amountCents: Math.round(creditUsd * 100),
        method: method.id,
        status: 'pending',
        reference,
        metadata: JSON.stringify({
          chargeUsd,
          creditUsd,
          feePercent: fee,
          promoCode: body.promoCode || null,
          details: method.details,
        }),
      },
    })

    return NextResponse.json({
      ok: true,
      deposit: {
        id: deposit.id,
        reference,
        status: 'pending',
        amountUsd: body.amountUsd,
        creditUsd,
        chargeUsd,
        method: method.id,
        label: method.label,
        kind: method.kind,
        details: method.details,
      },
      message:
        method.kind === 'gateway'
          ? 'Deposit recorded as pending. Complete payment with the gateway (auto-confirm coming soon). Admin can approve under Users.'
          : 'Send the exact amount using the details below, then wait for admin confirmation.',
    })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error('deposit', e)
    const msg = String(e?.message || e)
    if (msg.includes('deposits') || e?.code === 'P2021') {
      return NextResponse.json(
        {
          error:
            'deposits table missing. Run CREATE TABLE deposits in Supabase (see earlier migration).',
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as string
  try {
    const rows = await prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return NextResponse.json({ deposits: rows })
  } catch {
    return NextResponse.json({ deposits: [] })
  }
}
