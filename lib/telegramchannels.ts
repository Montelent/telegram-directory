/**
 * telegramchannels.me Simple API client
 * Docs: GET https://telegramchannels.me/api/getMediumInfo
 *       GET https://telegramchannels.me/api/searchMedia
 */

const BASE = 'https://telegramchannels.me/api'

export type MediumInfo = {
  username: string
  type: string
  title: string
  description?: string
  photo_url?: string
  subscribers?: number
  photos?: number
  videos?: number
  files?: number
  links?: number
  last_message?: { id: number; time: string; views: number }
  average_views?: number
  is_verified?: boolean
  is_restricted?: boolean
  is_nsfw?: boolean
  language?: string
}

export async function getMediumInfo(
  username: string,
  apiKey: string,
  live = false
): Promise<{ ok: true; data: MediumInfo } | { ok: false; reason: string; message: string }> {
  const params = new URLSearchParams({
    username: username.replace(/^@/, ''),
    apikey: apiKey,
  })
  if (live) params.set('live', '1')

  const res = await fetch(`${BASE}/getMediumInfo?${params}`, {
    next: { revalidate: 0 },
  })
  const json = await res.json()

  if (!json.status) {
    return {
      ok: false,
      reason: json.reason || 'unknown',
      message: json.message || 'Request failed',
    }
  }

  return { ok: true, data: json.data as MediumInfo }
}

export async function searchMedia(
  phrase: string,
  apiKey: string,
  options: {
    page_number?: number
    on_each_page?: number
    type?: 'channel' | 'group'
    sort_by?: string
    min_subscribers?: number
    verified?: boolean
    safe_mode?: boolean
  } = {}
): Promise<
  | {
      ok: true
      total: number
      channels: MediumInfo[]
      page_number: number
      on_each_page: number
    }
  | { ok: false; reason: string; message: string }
> {
  const params = new URLSearchParams({
    phrase,
    apikey: apiKey,
  })
  if (options.page_number) params.set('page_number', String(options.page_number))
  if (options.on_each_page) params.set('on_each_page', String(options.on_each_page))
  if (options.type) params.set('type', options.type)
  if (options.sort_by) params.set('sort_by', options.sort_by)
  if (options.min_subscribers) params.set('min_subscribers', String(options.min_subscribers))
  if (options.verified) params.set('verified', 'yes')
  if (options.safe_mode === false) params.set('safe_mode', 'off')

  const res = await fetch(`${BASE}/searchMedia?${params}`, {
    next: { revalidate: 0 },
  })
  const json = await res.json()

  if (!json.status && json.reason) {
    return {
      ok: false,
      reason: json.reason || 'unknown',
      message: json.message || 'Request failed',
    }
  }

  return {
    ok: true,
    total: json.total ?? 0,
    channels: json.channels ?? [],
    page_number: json.page_number ?? 1,
    on_each_page: json.on_each_page ?? 10,
  }
}
