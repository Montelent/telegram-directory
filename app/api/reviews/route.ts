import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  entityId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'user') {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const entity = await prisma.entity.findFirst({
      where: { id: data.entityId, status: 'APPROVED' },
    })
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    const review = await prisma.review.upsert({
      where: {
        userId_entityId: { userId, entityId: data.entityId },
      },
      create: {
        userId,
        entityId: data.entityId,
        rating: data.rating,
        comment: data.comment,
      },
      update: {
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      user: review.user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
