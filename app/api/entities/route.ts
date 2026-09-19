import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const q = searchParams.get('q')?.trim() || ''
  const category = searchParams.get('category') || ''
  const type = searchParams.get('type') || '' // GROUP | CHANNEL
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit

  const where: any = {
    status: 'APPROVED',
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (category) {
    where.category = { slug: category }
  }

  if (type === 'GROUP' || type === 'CHANNEL') {
    where.type = type
  }

  const [entities, total] = await Promise.all([
    prisma.entity.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ memberCount: 'desc' }, { title: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.entity.count({ where }),
  ])

  return NextResponse.json({
    data: entities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
