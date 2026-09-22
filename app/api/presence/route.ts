import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const WINDOW_MS = 3 * 60 * 1000 // 3 minutes = "online"
const KEY_PREFIX = 'presence:'

/** GET: count of online visitors. POST: heartbeat with visitor id */
export async function GET() {
  try {
    const since = Date.now() - WINDOW_MS
    const rows = await prisma.siteSetting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
    })
    let online = 0
    for (const r of rows) {
      const t = parseInt(r.value, 10)
      if (!Number.isNaN(t) && t >= since) online++
    }
    // Always show at least 1 when someone loads the site
    return NextResponse.json({ online: Math.max(online, 1) })
  } catch {
    return NextResponse.json({ online: 1 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    let vid = String(body.visitorId || '').slice(0, 64)
    if (!vid || vid.length < 8) {
      vid = randomBytes(12).toString('hex')
    }
    const key = `${KEY_PREFIX}${vid}`
    const now = String(Date.now())

    await prisma.siteSetting.upsert({
      where: { key },
      create: {
        id: randomBytes(12).toString('hex'),
        key,
        value: now,
      },
      update: { value: now },
    })

    // Opportunistic cleanup of stale presence keys
    const rows = await prisma.siteSetting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
      take: 200,
    })
    const cutoff = Date.now() - WINDOW_MS * 2
    for (const r of rows) {
      const t = parseInt(r.value, 10)
      if (!Number.isNaN(t) && t < cutoff) {
        await prisma.siteSetting.delete({ where: { key: r.key } }).catch(() => null)
      }
    }

    const since = Date.now() - WINDOW_MS
    let online = 0
    const fresh = await prisma.siteSetting.findMany({
      where: { key: { startsWith: KEY_PREFIX } },
    })
    for (const r of fresh) {
      const t = parseInt(r.value, 10)
      if (!Number.isNaN(t) && t >= since) online++
    }

    return NextResponse.json({ visitorId: vid, online: Math.max(online, 1) })
  } catch (e) {
    console.error('presence', e)
    return NextResponse.json({ visitorId: null, online: 1 })
  }
}
