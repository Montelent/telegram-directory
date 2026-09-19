import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  categoryId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const data = actionSchema.parse(body)

    const submission = await prisma.submission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Submission already processed' },
        { status: 400 }
      )
    }

    if (data.action === 'reject') {
      await prisma.submission.update({
        where: { id },
        data: {
          status: 'REJECTED',
          notes: data.notes,
        },
      })

      return NextResponse.json({ success: true, status: 'REJECTED' })
    }

    // Approve → create or update Entity
    const title = data.title || submission.title || submission.username
    const description = data.description ?? submission.description

    // Check if entity with this username already exists
    let entity = await prisma.entity.findUnique({
      where: { username: submission.username },
    })

    if (entity) {
      // Update existing
      entity = await prisma.entity.update({
        where: { id: entity.id },
        data: {
          title,
          description,
          type: submission.type,
          status: 'APPROVED',
          categoryId: data.categoryId || entity.categoryId,
          source: 'submission',
        },
      })
    } else {
      // Create new
      entity = await prisma.entity.create({
        data: {
          username: submission.username,
          title,
          description,
          type: submission.type,
          status: 'APPROVED',
          categoryId: data.categoryId,
          source: 'submission',
        },
      })
    }

    // Update submission
    await prisma.submission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        notes: data.notes,
        entityId: entity.id,
      },
    })

    return NextResponse.json({ success: true, status: 'APPROVED', entityId: entity.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Submission action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
