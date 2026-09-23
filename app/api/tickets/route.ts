import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(5).max(5000),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    })
    return NextResponse.json({ tickets })
  } catch {
    return NextResponse.json({ tickets: [], error: 'tickets unavailable' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Please log in to open a ticket' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  try {
    const data = createSchema.parse(await req.json())
    const ticket = await prisma.ticket.create({
      data: {
        subject: data.subject,
        message: data.message,
        status: 'OPEN',
        userId,
        messages: {
          create: {
            body: data.message,
            isAdmin: false,
            authorName: (session.user as any)?.name || session.user?.email || 'User',
          },
        },
      },
    })
    return NextResponse.json(ticket, { status: 201 })
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: e.errors?.[0]?.message || 'Invalid' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
