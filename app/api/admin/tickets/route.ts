import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    })
    return NextResponse.json({ tickets })
  } catch (e: any) {
    const msg = String(e?.message || e)
    if (msg.includes('ticket') || e?.code === 'P2021') {
      return NextResponse.json(
        { error: 'tickets table missing — run SQL migration', tickets: [] },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Failed', tickets: [] }, { status: 500 })
  }
}
