import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { loadEntityByUsernameOrId } from '@/lib/load-entity-page'
import EntityDetailView from '@/components/EntityDetailView'
import { entityPath } from '@/lib/entity-path'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  try {
    const { entity } = await loadEntityByUsernameOrId(decodeURIComponent(username))
    const title = entity.seoTitle || entity.title
    const description =
      entity.seoDescription || entity.shortDesc || entity.description || undefined
    const robotsStr = entity.robots || 'index,follow'
    const path = entityPath(entity)
    const imageUrl: string | undefined =
      entity.ogImage || entity.photoUrl || undefined
    return {
      title,
      description,
      alternates: entity.canonicalUrl
        ? { canonical: entity.canonicalUrl }
        : { canonical: path },
      robots: {
        index: !robotsStr.includes('noindex'),
        follow: !robotsStr.includes('nofollow'),
      },
      openGraph: {
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    }
  } catch {
    return {}
  }
}

export default async function GroupByUsernamePage({ params }: Props) {
  const { username } = await params
  const { entity, session } = await loadEntityByUsernameOrId(decodeURIComponent(username))
  const canonical = entityPath(entity)
  if (!canonical.startsWith('/groups/') && entity.username) {
    redirect(canonical)
  }
  return <EntityDetailView entity={entity} session={session} />
}
