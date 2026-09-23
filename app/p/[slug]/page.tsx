import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const page = await prisma.page.findUnique({
      where: { slug: decodeURIComponent(slug) },
    })
    if (!page || !page.published) return {}
    const robotsStr = page.robots || 'index,follow'
    return {
      title: page.seoTitle || page.title,
      description: page.seoDescription || undefined,
      alternates: page.canonicalUrl ? { canonical: page.canonicalUrl } : undefined,
      robots: {
        index: !robotsStr.includes('noindex'),
        follow: !robotsStr.includes('nofollow'),
      },
      openGraph: {
        title: page.seoTitle || page.title,
        description: page.seoDescription || undefined,
        images: page.ogImage ? [page.ogImage] : undefined,
      },
    }
  } catch {
    return {}
  }
}

export default async function PublicPageBySlug({ params }: Props) {
  const { slug } = await params
  let page: any = null
  try {
    page = await prisma.page.findUnique({
      where: { slug: decodeURIComponent(slug) },
    })
  } catch {
    notFound()
  }

  if (!page || !page.published) notFound()

  return (
    <main className="min-h-screen bg-[#faf4f4] overflow-x-hidden">
      {page.seoJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: page.seoJsonLd }}
        />
      )}
      <div className="container mx-auto px-4 py-10 max-w-3xl min-w-0">
        <nav className="text-xs text-slate-500 mb-4">
          <Link href="/" className="hover:text-[#8b1a1a]">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">{page.title}</span>
        </nav>
        <article className="bg-white rounded-2xl border border-[#f0e0e0] shadow-sm p-6 sm:p-10 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1212] mb-6 break-words">
            {page.title}
          </h1>
          <div
            className="prose prose-slate max-w-none prose-a:text-[#8b1a1a] prose-headings:text-[#1a1212] break-words"
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </article>
      </div>
    </main>
  )
}
