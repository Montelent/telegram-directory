import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMediumInfo, searchMedia } from '@/lib/telegramchannels'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { mode, username, phrase, importLimit = 10 } = body as {
      mode: 'lookup' | 'search'
      username?: string
      phrase?: string
      importLimit?: number
    }

    const integration = await prisma.apiIntegration.findFirst({
      where: {
        OR: [
          { name: { equals: 'telegramchannels', mode: 'insensitive' } },
          { name: { equals: 'TelegramChannels', mode: 'insensitive' } },
          { name: { contains: 'telegramchannels', mode: 'insensitive' } },
        ],
        isActive: true,
      },
    })

    if (!integration?.key) {
      return NextResponse.json(
        {
          error:
            'No active telegramchannels.me API key. Add it under Admin → API Integrations with name "telegramchannels".',
        },
        { status: 400 }
      )
    }

    const apiKey = integration.key
    const imported: string[] = []

    if (mode === 'lookup' && username) {
      const result = await getMediumInfo(username, apiKey)
      if (!result.ok) {
        return NextResponse.json({ error: result.message, reason: result.reason }, { status: 400 })
      }
      const d = result.data
      const uname = d.username?.toLowerCase()
      if (!uname) {
        return NextResponse.json({ error: 'No username in response' }, { status: 400 })
      }

      const entity = await prisma.entity.upsert({
        where: { username: uname },
        create: {
          username: uname,
          title: d.title || uname,
          description: d.description || null,
          type: d.type === 'group' ? 'GROUP' : 'CHANNEL',
          status: 'APPROVED',
          memberCount: d.subscribers ?? null,
          photoUrl: d.photo_url || null,
          isVerified: !!d.is_verified,
          language: d.language || null,
          source: 'telegramchannels',
          externalId: uname,
        },
        update: {
          title: d.title || uname,
          description: d.description || null,
          memberCount: d.subscribers ?? null,
          photoUrl: d.photo_url || null,
          isVerified: !!d.is_verified,
          language: d.language || null,
          source: 'telegramchannels',
          lastCheckedAt: new Date(),
        },
      })
      imported.push(entity.username || entity.id)
    } else if (mode === 'search' && phrase) {
      const result = await searchMedia(phrase, apiKey, {
        on_each_page: Math.min(50, importLimit),
        page_number: 1,
      })
      if (!result.ok) {
        return NextResponse.json({ error: result.message, reason: result.reason }, { status: 400 })
      }

      for (const d of result.channels.slice(0, importLimit)) {
        const uname = d.username?.toLowerCase()
        if (!uname) continue
        await prisma.entity.upsert({
          where: { username: uname },
          create: {
            username: uname,
            title: d.title || uname,
            description: d.description || null,
            type: d.type === 'group' ? 'GROUP' : 'CHANNEL',
            status: 'APPROVED',
            memberCount: d.subscribers ?? null,
            photoUrl: d.photo_url || null,
            isVerified: !!d.is_verified,
            language: d.language || null,
            source: 'telegramchannels',
            externalId: uname,
          },
          update: {
            title: d.title || uname,
            description: d.description || null,
            memberCount: d.subscribers ?? null,
            photoUrl: d.photo_url || null,
            isVerified: !!d.is_verified,
            language: d.language || null,
            lastCheckedAt: new Date(),
          },
        })
        imported.push(uname)
      }
    } else {
      return NextResponse.json({ error: 'Provide mode=lookup+username or mode=search+phrase' }, { status: 400 })
    }

    await prisma.apiIntegration.update({
      where: { id: integration.id },
      data: { lastUsedAt: new Date() },
    })

    return NextResponse.json({ imported, count: imported.length })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
