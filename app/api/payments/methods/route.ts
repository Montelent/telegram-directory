import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEnabledPaymentMethods } from '@/lib/payments'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const methods = await getEnabledPaymentMethods()
    return NextResponse.json({ methods })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ methods: [] })
  }
}
