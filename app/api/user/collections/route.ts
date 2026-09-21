import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

function key(userId: string, id: string) {
  return `collection:${userId}:${id}`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const { name, description } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const id = randomBytes(8).toString('hex')
  const collection = {
    id,
    name: String(name).trim(),
    description: String(description || '').trim(),
    items: [] as string[],
  }

  try {
    await prisma.siteSetting.upsert({
      where: { key: key(userId, id) },
      create: {
        id: randomBytes(12).toString('hex'),
        key: key(userId, id),
        value: JSON.stringify(collection),
      },
      update: { value: JSON.stringify(collection) },
    })
    return NextResponse.json({ collection }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Could not save. Ensure site_settings table exists.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const { id, addUsername } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const row = await prisma.siteSetting.findUnique({ where: { key: key(userId, id) } })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let collection = JSON.parse(row.value)
  if (addUsername && !collection.items.includes(addUsername)) {
    collection.items.push(addUsername)
  }
  await prisma.siteSetting.update({
    where: { key: key(userId, id) },
    data: { value: JSON.stringify(collection) },
  })
  return NextResponse.json({ collection })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as string
  const { id } = await req.json()
  await prisma.siteSetting.delete({ where: { key: key(userId, id) } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
