import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  content: z.string().optional().default(''),
  published: z.boolean().optional().default(false),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoJsonLd: z.string().optional().nullable(),
  focusKeyword: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  robots: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  try {
    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        updatedAt: true,
        createdAt: true,
      },
    })
    return NextResponse.json(pages)
  } catch (e: any) {
    const msg = String(e?.message || e)
    if (msg.includes('pages') || e?.code === 'P2021') {
      return NextResponse.json(
        { error: 'pages table missing. Run SQL: CREATE TABLE pages (...) — see supabase/full_migration.sql' },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Failed to load pages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const page = await prisma.page.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content || '',
        published: data.published ?? false,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        seoJsonLd: data.seoJsonLd || null,
        focusKeyword: data.focusKeyword || null,
        canonicalUrl: data.canonicalUrl || null,
        robots: data.robots || 'index,follow',
        ogImage: data.ogImage || null,
      },
    })
    return NextResponse.json(page)
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ error: e.errors?.[0]?.message || 'Invalid data' }, { status: 400 })
    }
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    console.error('create page', e)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}
