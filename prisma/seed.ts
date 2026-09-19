import { PrismaClient, EntityType, EntityStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create some default categories
  const categories = [
    { name: 'Cryptocurrency', slug: 'crypto', description: 'Trading, DeFi, NFTs, blockchain news' },
    { name: 'Technology', slug: 'tech', description: 'Programming, AI, gadgets, software' },
    { name: 'News & Media', slug: 'news', description: 'World news, journalism, current events' },
    { name: 'Gaming', slug: 'gaming', description: 'Video games, esports, game development' },
    { name: 'Education', slug: 'education', description: 'Learning, courses, language exchange' },
    { name: 'Business', slug: 'business', description: 'Entrepreneurship, marketing, startups' },
    { name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, memes, celebrities' },
    { name: 'Local & Regional', slug: 'local', description: 'City and country specific communities' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log(`Seeded ${categories.length} categories`)

  // Optional: create a sample approved entity (replace with real ones later)
  const cryptoCategory = await prisma.category.findUnique({ where: { slug: 'crypto' } })

  if (cryptoCategory) {
    await prisma.entity.upsert({
      where: { username: 'durov' },
      update: {},
      create: {
        username: 'durov',
        title: 'Durov\'s Channel',
        description: 'Pavel Durov official channel',
        type: EntityType.CHANNEL,
        status: EntityStatus.APPROVED,
        memberCount: 0,
        categoryId: cryptoCategory.id,
        source: 'manual',
        isVerified: true,
      },
    })
    console.log('Seeded sample entity @durov')
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
