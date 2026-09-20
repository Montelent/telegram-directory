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
    for (const [key, value] of Object.entries(settings || {})) {
      await setSiteSetting(key, value ?? '')
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Failed. Create site_settings table in Supabase.' },
      { status: 500 }
    )
  }
}
