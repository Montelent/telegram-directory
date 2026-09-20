import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  username: z.string().min(1).max(100),
  title: z.string().max(200).optional().nullable(),
  type: z.enum(['GROUP', 'CHANNEL']),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  const userId = (session.user as any).id as string

  try {
    const body = await req.json()
    const data = schema.parse(body)
    const username = data.username.replace(/^@/, '').toLowerCase()

    const media = await prisma.userMedia.create({
      data: {
        userId,
        username,
        title: data.title,
        type: data.type,
        status: 'PENDING',
      },
    })

    // Also create a public submission for admin queue
    await prisma.submission.create({
      data: {
        username,
        title: data.title,
        type: data.type,
        status: 'PENDING',
        userId,
        submittedBy: session.user?.email || undefined,
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json(
      { error: 'Failed. Make sure user_media table exists (run SQL migration).' },
      { status: 500 }
    )
  }
}
