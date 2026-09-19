import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { EntityType } from '@prisma/client'

const submissionSchema = z.object({
  username: z.string().min(1).max(100),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(['GROUP', 'CHANNEL']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = submissionSchema.parse(body)

    // Normalize username (remove @ and t.me/ prefixes)
    let username = data.username.trim()
    username = username.replace(/^@/, '')
    username = username.replace(/^https?:\/\/(t\.me|telegram\.me)\//, '')
    username = username.split('/')[0] // remove any path

    if (!username) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
    }

    // Check if already exists as approved entity
    const existing = await prisma.entity.findUnique({
      where: { username },
    })

    if (existing && existing.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'This group/channel is already in the directory' },
        { status: 409 }
      )
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        username,
        title: data.title,
        description: data.description,
        type: data.type as EntityType,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, id: submission.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
