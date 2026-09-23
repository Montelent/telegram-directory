import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { entityPath } from '@/lib/entity-path'
import EntityDetailView from '@/components/EntityDetailView'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const entity = await prisma.entity.findUnique({ where: { id } })
  if (!entity || entity.status !== 'APPROVED') return {}
  return {
    title: entity.seoTitle || entity.title,
    description: entity.seoDescription || entity.shortDesc || entity.description || undefined,
  }
}

/** Legacy /entity/[id] — redirect to SEO path when username exists */
export default async function EntityByIdPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const entity = await prisma.entity.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!entity) notFound()
  if (entity.status !== 'APPROVED') {
    const role = (session?.user as any)?.role
    if (role !== 'admin') notFound()
  }

  if (entity.username) {
    redirect(entityPath(entity))
  }

  return <EntityDetailView entity={entity} session={session} />
}
