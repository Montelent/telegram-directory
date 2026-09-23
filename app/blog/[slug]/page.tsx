import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: decodeURIComponent(slug) },
    })
    if (!post || !post.published) return {}
    const robotsStr = post.robots || 'index,follow'
    const title = post.seoTitle || post.title
    const description = post.seoDescription || post.excerpt || undefined
    return {
      title,
      description,
      alternates: post.canonicalUrl ? { canonical: post.canonicalUrl } : undefined,
      robots: {
        index: !robotsStr.includes('noindex'),
        follow: !robotsStr.includes('nofollow'),
      },
      openGraph: {
        title,
        description,
        type: 'article',
        images: post.coverImage ? [post.coverImage] : undefined,
        publishedTime: post.publishedAt?.toISOString(),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: post.coverImage ? [post.coverImage] : undefined,
      },
    }
  } catch {
    return {}
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  let post
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug: decodeURIComponent(slug) },
      include: { category: true },
    })
  } catch {
    notFound()
  }

  if (!post || !post.published) notFound()

  const jsonLd =
    post.seoJsonLd ||
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      datePublished: post.publishedAt?.toISOString(),
      image: post.coverImage || undefined,
    })

  return (
    <main className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <article className="container mx-auto px-4 py-10 max-w-3xl">
        <Link href="/blog" className="text-sm text-blue-600 hover:underline">
          ← Blog
        </Link>
        <header className="mt-4 mb-8">
          {post.category && (
            <span className="text-sm text-blue-600">{post.category.name}</span>
          )}
          <h1 className="text-3xl font-bold text-slate-900 mt-1">{post.title}</h1>
          {post.publishedAt && (
            <p className="text-sm text-slate-400 mt-2">
              {new Date(post.publishedAt).toLocaleDateString()}
            </p>
          )}
        </header>
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt=""
            className="w-full rounded-xl mb-8 max-h-96 object-cover"
          />
        )}
        <div
          className="prose prose-slate max-w-none bg-white rounded-xl border p-6 sm:p-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  )
}
