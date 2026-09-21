import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSiteSettings, setSiteSetting } from '@/lib/site-settings'

function isAdmin(session: any) {
  return session && (session.user as any)?.role === 'admin'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const settings = await getSiteSettings()
  return NextResponse.json({ settings })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const settings = body.settings as Record<string, string>
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
    }

    for (const [key, value] of Object.entries(settings)) {
      await setSiteSetting(key, value ?? '')
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('settings save error', e)
    const msg = String(e?.message || e)
    const hint = msg.includes('site_settings') || msg.includes('does not exist') || e?.code === 'P2021'
      ? 'Run this in Supabase SQL Editor: CREATE TABLE IF NOT EXISTS "site_settings" ("id" TEXT PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "value" TEXT NOT NULL DEFAULT \'\', "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);'
      : msg.slice(0, 200)
    return NextResponse.json({ error: 'Failed to save', detail: hint }, { status: 500 })
  }
}
