import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        entity: { select: { id: true, title: true, username: true, type: true, status: true } },
      },
    })
    return NextResponse.json({ reports })
  } catch (e: any) {
    // Fallback: legacy site_settings reports
    try {
      const rows = await prisma.siteSetting.findMany({
        where: { key: { startsWith: 'report:' } },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      })
      const reports = rows
        .map((r) => {
          try {
            return JSON.parse(r.value)
          } catch {
            return null
          }
        })
        .filter(Boolean)
      return NextResponse.json({ reports, legacy: true })
    } catch {
      return NextResponse.json({
        error: 'reports table missing — run SQL migration',
        reports: [],
      }, { status: 500 })
    }
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const { id, status, notes } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const report = await prisma.report.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    })
    return NextResponse.json(report)
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.report.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
