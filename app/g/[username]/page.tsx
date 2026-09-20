import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

/** Redirect /g/username → /entity/id for consistent detail UI */
export default async function EntityByUsernamePage({ params }: Props) {
  const { username: raw } = await params
  const username = decodeURIComponent(raw).toLowerCase().replace(/^@/, '').trim()

  const entity = await prisma.entity.findFirst({
    where: {
      OR: [
        { username: { equals: username, mode: 'insensitive' } },
        { id: raw },
      ],
    },
    select: { id: true, status: true },
  })

  if (!entity) notFound()
  redirect(`/entity/${entity.id}`)
}
