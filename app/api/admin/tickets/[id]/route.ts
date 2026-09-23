import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { sendMail, ticketReplyEmailHtml } from '@/lib/mail'
import { getSiteSettings } from '@/lib/site-settings'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
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
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  try {
    const { body } = await req.json()
    if (!body || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        body: body.trim(),
        isAdmin: true,
        authorName: 'Support',
      },
    })
    await prisma.ticket.update({
      where: { id },
      data: { status: 'OPEN', updatedAt: new Date() },
    })

    // Notify user by email if possible
    if (ticket.user?.email) {
      const settings = await getSiteSettings()
      const siteName = settings.site_name || 'Telegram Directory'
      const base = settings.seo_canonical_base || ''
      const ticketUrl = `${base}/dashboard/tickets`
      await sendMail({
        to: ticket.user.email,
        subject: `[${siteName}] Reply: ${ticket.subject}`,
        html: ticketReplyEmailHtml(siteName, ticket.subject, body.trim().slice(0, 400), ticketUrl),
      })
    }

    return NextResponse.json(msg)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to reply' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  try {
    const { status } = await req.json()
    if (status !== 'OPEN' && status !== 'CLOSED') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json(ticket)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  try {
    await prisma.ticketMessage.deleteMany({ where: { ticketId: id } })
    await prisma.ticket.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
