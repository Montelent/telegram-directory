import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const { id } = await params
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(ticket)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const { id } = await params
  try {
    const { body } = await req.json()
    if (!body || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }
    const ticket = await prisma.ticket.findFirst({ where: { id, userId } })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (ticket.status === 'CLOSED') {
      return NextResponse.json({ error: 'Ticket is closed' }, { status: 400 })
    }
    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        body: body.trim(),
        isAdmin: false,
        authorName: (session.user as any)?.name || session.user?.email || 'User',
      },
    })
    await prisma.ticket.update({ where: { id }, data: { updatedAt: new Date() } })
    return NextResponse.json(msg)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
