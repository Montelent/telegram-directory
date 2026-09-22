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

function parseMeta(notes: string | null | undefined) {
  const out: { memberCount?: number; photoUrl?: string; categorySlug?: string } = {}
  if (!notes) return out
  const mc = notes.match(/memberCount:(\d+)/i)
  if (mc) out.memberCount = parseInt(mc[1], 10)
  const ph = notes.match(/photo:(https?:\/\/\S+)/i)
  if (ph) out.photoUrl = ph[1]
  const cat = notes.match(/Category:\s*([a-z0-9_-]+)/i)
  if (cat) out.categorySlug = cat[1].toLowerCase()
  return out
}

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

    const submission = await prisma.submission.findUnique({ where: { id } })
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
    const meta = parseMeta(submission.notes)

    // Resolve category: explicit admin choice → user-requested slug → none
    let categoryId = data.categoryId || undefined
    if (!categoryId && meta.categorySlug) {
      const cat = await prisma.category.findFirst({
        where: { slug: meta.categorySlug },
      })
      if (cat) categoryId = cat.id
    }

    let entity = await prisma.entity.findUnique({
      where: { username: submission.username },
    })

    const entityData = {
      title,
      description,
      type: submission.type,
      status: 'APPROVED' as const,
      categoryId: categoryId || entity?.categoryId || null,
      language: submission.language || entity?.language,
      country: submission.country || entity?.country,
      shortDesc: (submission as any).shortDesc || entity?.shortDesc,
      longDesc: (submission as any).longDesc || entity?.longDesc,
      tags: (submission as any).tags || entity?.tags,
      isNsfw: (submission as any).isNsfw ?? entity?.isNsfw ?? false,
      memberCount: meta.memberCount ?? entity?.memberCount ?? null,
      photoUrl: meta.photoUrl || entity?.photoUrl || null,
      source: 'submission',
      lastCheckedAt: new Date(),
    }

    if (entity) {
      entity = await prisma.entity.update({
        where: { id: entity.id },
        data: entityData,
      })
    } else {
      entity = await prisma.entity.create({
        data: {
          username: submission.username,
          ...entityData,
        },
      })
    }

    await prisma.submission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        notes: data.notes ?? submission.notes,
        entityId: entity.id,
      },
    })

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

    return NextResponse.json({ success: true, status: 'APPROVED', entityId: entity.id, categoryId })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Submission action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
