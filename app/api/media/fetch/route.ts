import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMediumInfo } from '@/lib/telegramchannels'

function parseUsername(raw: string): string | null {
  const cleaned = raw.trim()
  const match = cleaned.match(
    /(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)?\+?@?([a-zA-Z0-9_]{4,})/i
  )
  if (!match) return null
  const u = match[1]
  if (/^joinchat$/i.test(u)) return null
  return u
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

function metaContent(html: string, property: string): string | null {
  const re1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i'
  )
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    'i'
  )
  const m = html.match(re1) || html.match(re2)
  return m ? decodeHtml(m[1]) : null
}

function stripTelegramSuffix(title: string) {
  return title
    .replace(/\s*[—–-]\s*Telegram$/i, '')
    .replace(/\s*on Telegram$/i, '')
    .trim()
}

function buildShortDesc(raw: string | null, max = 170): string {
  if (!raw) return ''
  const t = raw.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1).trimEnd() + '…'
}

function parseMemberCount(html: string): number | null {
  // Telegram public pages: <div class="tgme_page_extra">1 234 subscribers</div>
  const patterns = [
    /tgme_page_extra[^>]*>([^<]+)</i,
    /([\d\s\u00a0,.]+)\s*(subscribers|members|subscribers?)/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (!m) continue
    const raw = (m[1] || '').replace(/[^\d]/g, '')
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n) && n > 0) return n
  }
  return null
}

async function getApiKey(): Promise<string | null> {
  try {
    const integration = await prisma.apiIntegration.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { contains: 'telegramchannels', mode: 'insensitive' } },
          { name: { contains: 'telegram', mode: 'insensitive' } },
        ],
      },
    })
    return integration?.key || null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = parseUsername(String(body.link || body.username || ''))
    if (!username) {
      return NextResponse.json({ error: 'Invalid Telegram link or username' }, { status: 400 })
    }

    const url = `https://t.me/${username}`
    let title = username
    let shortDesc = ''
    let longDesc = ''
    let photoUrl: string | null = null
    let type: 'GROUP' | 'CHANNEL' = 'CHANNEL'
    let memberCount: number | null = null
    let language: string | null = null
    let isVerified = false
    let isNsfw = false
    let source = 't.me'
    let warning: string | undefined

    // 1) Prefer telegramchannels.me API when key is configured (subscribers + language)
    const apiKey = await getApiKey()
    if (apiKey) {
      try {
        const result = await getMediumInfo(username, apiKey, true)
        if (result.ok) {
          const d = result.data
          title = d.title || username
          longDesc = d.description || ''
          shortDesc = buildShortDesc(longDesc, 170)
          photoUrl = d.photo_url || null
          memberCount = d.subscribers ?? null
          language = d.language || null
          isVerified = !!d.is_verified
          isNsfw = !!d.is_nsfw
          type = d.type === 'group' ? 'GROUP' : 'CHANNEL'
          source = 'telegramchannels'
        } else {
          warning = `API: ${result.message}. Falling back to t.me scrape.`
        }
      } catch (e) {
        console.error('getMediumInfo', e)
        warning = 'API lookup failed; using t.me page.'
      }
    } else {
      warning =
        'No telegramchannels API key — subscribers may be incomplete. Add key in Admin → API Integrations (name: telegramchannels).'
    }

    // 2) Always enrich / fill gaps from public t.me page
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        next: { revalidate: 0 },
      })
      if (res.ok) {
        const html = await res.text()
        if (title === username) {
          title = stripTelegramSuffix(
            metaContent(html, 'og:title') ||
              metaContent(html, 'twitter:title') ||
              username
          )
        }
        if (!longDesc) {
          longDesc =
            metaContent(html, 'og:description') ||
            metaContent(html, 'twitter:description') ||
            metaContent(html, 'description') ||
            ''
          shortDesc = buildShortDesc(longDesc, 170)
        }
        if (!photoUrl) {
          photoUrl =
            metaContent(html, 'og:image') || metaContent(html, 'twitter:image') || null
        }
        if (memberCount == null) {
          memberCount = parseMemberCount(html)
        }
        const lower = html.toLowerCase()
        if (lower.includes('members') && !lower.includes('subscribers')) {
          type = 'GROUP'
        } else if (lower.includes('subscribers')) {
          type = 'CHANNEL'
        }
      }
    } catch (e) {
      console.error('t.me scrape', e)
    }

    // Country is not on t.me / simple API — leave for user or admin
    return NextResponse.json({
      username,
      title: title.slice(0, 120),
      shortDesc,
      longDesc,
      photoUrl,
      type,
      memberCount,
      language,
      isVerified,
      isNsfw,
      inviteLink: url,
      source,
      warning,
      note:
        'Ranks appear after the listing is approved and compared to other channels by member count. Country is set manually if needed.',
    })
  } catch (e) {
    console.error('media fetch', e)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}
