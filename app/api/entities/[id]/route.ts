import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const entity = await prisma.entity.findFirst({
    where: { id, status: 'APPROVED' },
    include: { category: true },
  })
  if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(entity)
}
