import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function requireAdmin(session: any) {
  return session && (session.user as any)?.role === 'admin'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const posts = await prisma.blogPost.findMany({
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(posts)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Blog tables missing. Run the SQL migration.' },
      { status: 500 }
    )
  }
}

const schema = z.object({
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const seoTitle = data.seoTitle || data.title
    const seoDescription = data.seoDescription || data.excerpt || ''

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        seoTitle,
        seoDescription,
        // Client (BlogSeoPanel) builds the full @graph JSON-LD document.
        // Fall back to a minimal one only if the client somehow sent nothing.
        seoJsonLd:
          data.seoJsonLd ||
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: seoTitle,
            description: seoDescription,
          }),
        focusKeyword: data.focusKeyword,
        canonicalUrl: data.canonicalUrl,
        robots: data.robots || 'index,follow',
        published: !!data.published,
        publishedAt: data.published ? new Date() : null,
        categoryId: data.categoryId || null,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
