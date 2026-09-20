import { getSiteSettings } from '@/lib/site-settings'

/** Injects header/footer scripts and ad slots from admin settings */
export async function HeaderScripts() {
  const s = await getSiteSettings()
  if (!s.header_scripts) return null
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: s.header_scripts }}
    />
  )
}

export async function FooterScripts() {
  const s = await getSiteSettings()
  if (!s.footer_scripts && !s.ad_slot_footer) return null
  return (
    <>
      {s.ad_slot_footer ? (
        <div
          className="container mx-auto px-4 py-4"
          dangerouslySetInnerHTML={{ __html: s.ad_slot_footer }}
        />
      ) : null}
      {s.footer_scripts ? (
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: s.footer_scripts }} />
      ) : null}
    </>
  )
}

export async function AdSlot({ slot }: { slot: 'header' | 'sidebar' | 'in_content' }) {
  const s = await getSiteSettings()
  const key =
    slot === 'header'
      ? 'ad_slot_header'
      : slot === 'sidebar'
        ? 'ad_slot_sidebar'
        : 'ad_slot_in_content'
  const html = s[key]
  if (!html) return null
  return (
    <div
      className="my-4 flex justify-center"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
