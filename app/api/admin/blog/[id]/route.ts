import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function requireAdmin(session: any) {
  return session && (session.user as any)?.role === 'admin'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}

const updateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  content: z.string().default(''),
  coverImage: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoJsonLd: z.string().optional().nullable(),
  focusKeyword: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  robots: z.string().optional().nullable(),
  published: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    if (data.slug) {
      const existing = await prisma.blogPost.findFirst({
        where: { slug: data.slug, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
      }
    }

    const existingPost = await prisma.blogPost.findUnique({ where: { id } })
    if (!existingPost) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const seoTitle = data.seoTitle || data.title
    const seoDescription = data.seoDescription || data.excerpt || ''
    // Was already published before, or is being published now
    const wasPublished = existingPost.published
    const willBePublished = !!data.published
    const publishedAt = willBePublished
      ? existingPost.publishedAt || new Date()
      : wasPublished && !willBePublished
      ? null
      : existingPost.publishedAt

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        seoTitle,
        seoDescription,
        seoJsonLd: data.seoJsonLd || null,
        focusKeyword: data.focusKeyword,
        canonicalUrl: data.canonicalUrl,
        robots: data.robots || 'index,follow',
        published: willBePublished,
        publishedAt,
        categoryId: data.categoryId || null,
      },
    })

    return NextResponse.json(post)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await prisma.blogPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
