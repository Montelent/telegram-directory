import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings, setSiteSetting } from '@/lib/site-settings'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, detail: auth.debug },
      { status: auth.status }
    )
  }
  const settings = await getSiteSettings()
  return NextResponse.json({ settings })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, detail: auth.debug },
      { status: auth.status }
    )
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
    const hint =
      msg.includes('site_settings') || msg.includes('does not exist') || e?.code === 'P2021'
        ? 'Create site_settings table in Supabase SQL Editor.'
        : msg.slice(0, 240)
    return NextResponse.json({ error: 'Failed to save', detail: hint }, { status: 500 })
  }
}
