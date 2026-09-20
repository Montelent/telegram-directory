import { prisma } from './prisma'

export type SiteSettingsMap = Record<string, string>

const DEFAULTS: SiteSettingsMap = {
  header_scripts: '',
  footer_scripts: '',
  ad_slot_header: '',
  ad_slot_sidebar: '',
  ad_slot_in_content: '',
  ad_slot_footer: '',
  site_name: 'Telegram Directory',
  default_seo_title: 'Telegram Directory – Groups & Channels',
  default_seo_description: 'Discover public Telegram groups and channels.',
}

/** Read settings; falls back to defaults if table missing */
export async function getSiteSettings(): Promise<SiteSettingsMap> {
  try {
    const rows = await (prisma as any).siteSetting.findMany()
    const map = { ...DEFAULTS }
    for (const r of rows) {
      map[r.key] = r.value ?? ''
    }
    return map
  } catch {
    return { ...DEFAULTS }
  }
}

export async function setSiteSetting(key: string, value: string) {
  return (prisma as any).siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}
