/** Build public SEO path for an entity (channel / group / bot). */
export function entityPath(entity: {
  id: string
  username?: string | null
  type?: string | null
  tags?: string | null
  source?: string | null
  title?: string | null
}): string {
  const username = (entity.username || '').replace(/^@/, '').trim()
  if (!username) return '/entity/' + entity.id

  const lower = username.toLowerCase()
  const isBot =
    lower.endsWith('bot') ||
    lower.endsWith('_bot') ||
    (entity.tags || '').toLowerCase().includes('bot') ||
    entity.source === 'bot' ||
    (entity.title || '').toLowerCase().includes('bot')

  if (isBot) return '/bots/' + encodeURIComponent(username)
  if (entity.type === 'GROUP') return '/groups/' + encodeURIComponent(username)
  return '/channels/' + encodeURIComponent(username)
}
