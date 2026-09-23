import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function loadEntityByUsernameOrId(slug: string) {
  const session = await getServerSession(authOptions)
  const clean = slug.replace(/^@/, '').trim()

  let entity = await prisma.entity.findFirst({
    where: { username: { equals: clean, mode: 'insensitive' } },
    include: { category: true },
  })

  if (!entity) {
    entity = await prisma.entity.findUnique({
      where: { id: clean },
      include: { category: true },
    })
  }

  if (!entity) notFound()
  if (entity.status !== 'APPROVED') {
    const role = (session?.user as any)?.role
    if (role !== 'admin') notFound()
  }

  return { entity, session }
}

export async function loadEntityExtras(entityId: string, entity: {
  memberCount: number | null
  title: string
  categoryId: string | null
  language: string | null
  id: string
}) {
  let reviews: {
    id: string
    rating: number
    comment: string | null
    createdAt: Date
    user: { name: string | null; email: string }
  }[] = []
  try {
    reviews = await prisma.review.findMany({
      where: { entityId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  } catch {
    /* */
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null

  let globalRank: number | null = null
  let categoryRank: number | null = null
  let languageRank: number | null = null
  let totalApproved = 0

  try {
    totalApproved = await prisma.entity.count({ where: { status: 'APPROVED' } })
    if (entity.memberCount != null) {
      globalRank =
        (await prisma.entity.count({
          where: {
            status: 'APPROVED',
            OR: [
              { memberCount: { gt: entity.memberCount } },
              { memberCount: entity.memberCount, title: { lt: entity.title } },
            ],
          },
        })) + 1
    }
    if (entity.categoryId && entity.memberCount != null) {
      categoryRank =
        (await prisma.entity.count({
          where: {
            status: 'APPROVED',
            categoryId: entity.categoryId,
            memberCount: { gt: entity.memberCount },
          },
        })) + 1
    }
    if (entity.language && entity.memberCount != null) {
      languageRank =
        (await prisma.entity.count({
          where: {
            status: 'APPROVED',
            language: entity.language,
            memberCount: { gt: entity.memberCount },
          },
        })) + 1
    }
  } catch {
    /* */
  }

  let related: any[] = []
  try {
    related = await prisma.entity.findMany({
      where: {
        status: 'APPROVED',
        id: { not: entity.id },
        OR: [
          entity.categoryId ? { categoryId: entity.categoryId } : {},
          entity.language ? { language: entity.language } : {},
        ].filter((x) => Object.keys(x).length > 0),
      },
      include: { category: true },
      orderBy: { memberCount: 'desc' },
      take: 8,
    })
  } catch {
    related = []
  }

  return { reviews, avgRating, globalRank, categoryRank, languageRank, totalApproved, related }
}
