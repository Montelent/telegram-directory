import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { EntityType } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const submissionSchema = z.object({
  username: z.string().min(1).max(100),
  title: z.string().max(200).optional(),
  description: z.string().max(10000).optional(),
  shortDesc: z.string().max(300).optional(),
  longDesc: z.string().max(20000).optional(),
  tags: z.string().max(500).optional(),
  type: z.enum(['GROUP', 'CHANNEL']),
  notes: z.string().max(2000).optional(),
  language: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  isNsfw: z.boolean().optional(),
  wantFeature: z.boolean().optional(),
  memberCount: z.number().int().nonnegative().optional().nullable(),
  photoUrl: z.string().max(2000).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    const userId = (session?.user as any)?.id as string | undefined

    // Submissions require a logged-in site user (not admin session)
    if (!session || role !== 'user' || !userId) {
      return NextResponse.json(
        { error: 'You must be logged in to submit media. Please log in or create an account.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = submissionSchema.parse(body)

    let username = data.username.trim()
    username = username.replace(/^@/, '')
    username = username.replace(/^https?:\/\/(t\.me|telegram\.me)\//, '')
    username = username.split('/')[0]

    if (!username) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
    }

    const existing = await prisma.entity.findUnique({
      where: { username },
    })

    if (existing && existing.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'This group/channel is already in the directory' },
        { status: 409 }
      )
    }

    const description =
      data.description ||
      [data.shortDesc, data.longDesc].filter(Boolean).join('\n\n') ||
      null

    // Pack extra fields into notes so approve can restore them
    const metaBits = [
      data.notes || '',
      data.memberCount != null ? `memberCount:${data.memberCount}` : '',
      data.photoUrl ? `photo:${data.photoUrl}` : '',
    ]
      .filter(Boolean)
      .join(' | ')

    const submission = await prisma.submission.create({
      data: {
        username,
        title: data.title,
        description,
        shortDesc: data.shortDesc,
        longDesc: data.longDesc,
        tags: data.tags,
        language: data.language,
        country: data.country,
        isNsfw: !!data.isNsfw,
        wantFeature: !!data.wantFeature,
        type: data.type as EntityType,
        status: 'PENDING',
        notes: metaBits || null,
        userId,
        submittedBy: (session.user as any)?.email || null,
      },
    })

    try {
      await prisma.userMedia.create({
        data: {
          userId,
          username,
          title: data.title || username,
          type: data.type as EntityType,
          status: 'PENDING',
          notes: data.tags || null,
        },
      })
    } catch (e) {
      console.error('userMedia mirror failed', e)
    }

    return NextResponse.json({ success: true, id: submission.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Submission error:', error)
    return NextResponse.json(
      { error: 'Database error. Ensure submissions table exists in Supabase.' },
      { status: 500 }
    )
  }
}
