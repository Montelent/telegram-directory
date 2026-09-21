import { NextRequest, NextResponse } from 'next/server'

function parseUsername(raw: string): string | null {
  const cleaned = raw.trim()
  const match = cleaned.match(
    /(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)?\+?@?([a-zA-Z0-9_]{4,})/i
  )
  if (!match) return null
  const u = match[1]
  // skip invite hash-style only paths that are pure numbers sometimes ok
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
    .replace(/&#(\\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

function metaContent(html: string, property: string): string | null {
  // property="og:title" content="..."
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

/** Build short description similar to telegramchannels.me style */
function buildShortDesc(raw: string | null, max = 170): string {
  if (!raw) return ''
  let t = raw.replace(/\s+/g, ' ').trim()
  // keep hashtags and urls
  if (t.length <= max) return t
  return t.slice(0, max - 1).trimEnd() + '…'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = parseUsername(String(body.link || body.username || ''))
    if (!username) {
      return NextResponse.json({ error: 'Invalid Telegram link or username' }, { status: 400 })
    }

    const url = `https://t.me/${username}`
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return NextResponse.json(
        {
          username,
          title: username,
          shortDesc: '',
          photoUrl: null,
          type: 'CHANNEL',
          inviteLink: url,
          warning: 'Could not load Telegram page; fill details manually.',
        },
        { status: 200 }
      )
    }

    const html = await res.text()

    let title =
      metaContent(html, 'og:title') ||
      metaContent(html, 'twitter:title') ||
      username
    title = stripTelegramSuffix(title)

    const ogDesc =
      metaContent(html, 'og:description') ||
      metaContent(html, 'twitter:description') ||
      metaContent(html, 'description') ||
      ''

    const shortDesc = buildShortDesc(ogDesc, 170)

    const photoUrl =
      metaContent(html, 'og:image') ||
      metaContent(html, 'twitter:image') ||
      null

    // Heuristic: group vs channel from page text
    const lower = html.toLowerCase()
    let type: 'GROUP' | 'CHANNEL' = 'CHANNEL'
    if (lower.includes('members') && !lower.includes('subscribers')) {
      type = 'GROUP'
    } else if (lower.includes('subscribers')) {
      type = 'CHANNEL'
    }

    // Optional member count from page
    let memberCount: number | null = null
    const countMatch = html.match(
      /([\d\s,.]+)\s*(subscribers|members)/i
    )
    if (countMatch) {
      const n = parseInt(countMatch[1].replace(/[\s,]/g, ''), 10)
      if (!Number.isNaN(n)) memberCount = n
    }

    return NextResponse.json({
      username,
      title: title.slice(0, 120),
      shortDesc,
      longDesc: ogDesc,
      photoUrl,
      type,
      memberCount,
      inviteLink: url,
    })
  } catch (e) {
    console.error('media fetch', e)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}
