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
  if (!session || (session.user as any)?.role !== 'admin') {
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
      return NextResponse.json({ error: 'Submission already processed' }, { status: 400 })
    }

    if (data.action === 'reject') {
      await prisma.submission.update({
        where: { id },
        data: { status: 'REJECTED', notes: data.notes },
      })

      // Mirror reject on user_media rows with same username
      try {
        await prisma.userMedia.updateMany({
          where: { username: submission.username },
          data: { status: 'REJECTED' },
        })
      } catch {
        /* */
      }

      return NextResponse.json({ success: true, status: 'REJECTED' })
    }

    const title = data.title || submission.title || submission.username
    const description = data.description ?? submission.description

    let entity = await prisma.entity.findUnique({
      where: { username: submission.username },
    })

    if (entity) {
      entity = await prisma.entity.update({
        where: { id: entity.id },
        data: {
          title,
          description,
          type: submission.type,
          status: 'APPROVED',
          categoryId: data.categoryId || entity.categoryId,
          language: submission.language || entity.language,
          country: submission.country || entity.country,
          shortDesc: (submission as any).shortDesc || entity.shortDesc,
          longDesc: (submission as any).longDesc || entity.longDesc,
          tags: (submission as any).tags || entity.tags,
          isNsfw: (submission as any).isNsfw ?? entity.isNsfw,
          source: 'submission',
        },
      })
    } else {
      entity = await prisma.entity.create({
        data: {
          username: submission.username,
          title,
          description,
          type: submission.type,
          status: 'APPROVED',
          categoryId: data.categoryId,
          language: submission.language,
          country: submission.country,
          shortDesc: (submission as any).shortDesc,
          longDesc: (submission as any).longDesc,
          tags: (submission as any).tags,
          isNsfw: (submission as any).isNsfw ?? false,
          source: 'submission',
        },
      })
    }

    await prisma.submission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        notes: data.notes,
        entityId: entity.id,
      },
    })

    // Critical: update user dashboard media list status
    try {
      await prisma.userMedia.updateMany({
        where: { username: submission.username },
        data: {
          status: 'APPROVED',
          entityId: entity.id,
          title: title,
        },
      })
    } catch (e) {
      console.error('userMedia sync failed', e)
    }

    return NextResponse.json({ success: true, status: 'APPROVED', entityId: entity.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Submission action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
