import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const integrations = await prisma.apiIntegration.findMany({
    orderBy: { name: 'asc' },
  })

  // Mask keys for security (show only last 4 chars)
  const masked = integrations.map((i) => ({
    ...i,
    key: i.key ? `••••${i.key.slice(-4)}` : '',
  }))

  return NextResponse.json(masked)
}

const upsertSchema = z.object({
  name: z.string().min(1),
  key: z.string(),
  isActive: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = upsertSchema.parse(body)

    const existing = await prisma.apiIntegration.findFirst({
      where: { name: data.name },
    })

    if (existing) {
      const updated = await prisma.apiIntegration.update({
        where: { id: existing.id },
        data: {
          key: data.key,
          isActive: data.isActive ?? !!data.key,
          lastUsedAt: null,
        },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.apiIntegration.create({
      data: {
        name: data.name,
        key: data.key,
        isActive: data.isActive ?? !!data.key,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
