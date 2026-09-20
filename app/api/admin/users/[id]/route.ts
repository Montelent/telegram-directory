import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const data: any = {}
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  if (typeof body.balanceCents === 'number') data.balanceCents = body.balanceCents
  if (typeof body.name === 'string') data.name = body.name

  const user = await prisma.user.update({ where: { id }, data })
  return NextResponse.json(user)
}
