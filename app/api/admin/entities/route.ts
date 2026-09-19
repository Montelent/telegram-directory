import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const q = searchParams.get('q')?.trim() || ''

  const where: any = {}
  if (status) where.status = status
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
    ]
  }

  const entities = await prisma.entity.findMany({
    where,
    include: { category: true },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(entities)
}
