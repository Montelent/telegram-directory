import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const deposits = await prisma.deposit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true, name: true, balanceCents: true } },
      },
    })
    return NextResponse.json({ deposits })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'deposits table missing or query failed', deposits: [] },
      { status: 500 }
    )
  }
}
