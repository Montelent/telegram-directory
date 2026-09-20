import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: any) {
  return session && (session.user as any)?.role === 'admin'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const cats = await prisma.blogCategory.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(cats)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, slug } = await req.json()
  const cat = await prisma.blogCategory.create({ data: { name, slug } })
  return NextResponse.json(cat, { status: 201 })
}
