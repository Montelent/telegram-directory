import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  const type = req.nextUrl.searchParams.get('type') // CHANNEL | GROUP | BOT | empty
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10) || 20, 40)

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] })
  }

  const where: any = {
    status: 'APPROVED',
    OR: [
      { id: { equals: q } },
      { username: { equals: q.replace(/^@/, ''), mode: 'insensitive' } },
      { username: { contains: q.replace(/^@/, ''), mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
    ],
  }

  if (type === 'CHANNEL' || type === 'GROUP') {
    where.type = type
  } else if (type === 'BOT') {
    where.OR = [
      {
        AND: [
          {
            OR: [
              { username: { endsWith: 'bot', mode: 'insensitive' } },
              { tags: { contains: 'bot', mode: 'insensitive' } },
              { source: { equals: 'bot' } },
            ],
          },
          {
            OR: [
              { id: { equals: q } },
              { username: { contains: q.replace(/^@/, ''), mode: 'insensitive' } },
              { title: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
    ]
  }

  try {
    const results = await prisma.entity.findMany({
      where,
      take: limit,
      orderBy: { memberCount: 'desc' },
      select: {
        id: true,
        title: true,
        username: true,
        memberCount: true,
        type: true,
        language: true,
        country: true,
        isVerified: true,
        isFeatured: true,
        description: true,
        category: { select: { name: true, slug: true } },
      },
    })
    return NextResponse.json({ results })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ results: [] })
  }
}
