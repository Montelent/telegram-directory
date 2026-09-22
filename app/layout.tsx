import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import ConditionalFooter from '@/components/ConditionalFooter'
import Providers from '@/components/Providers'
import { HeaderScripts, FooterScripts, AdSlot } from '@/components/SiteScripts'
import { getSiteSettings } from '@/lib/site-settings'
import { buildPalette, paletteToCss } from '@/lib/theme'
import { parseTopLinks, parseDrawerSections } from '@/lib/menu'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Telegram Directory – Discover Public Groups & Channels',
  description:
    'Search and browse public Telegram groups and channels by category, language, and more.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings()
  const palette = buildPalette(settings.color_primary, settings.color_accent)
  const themeCss = paletteToCss(palette)
  const topLinks = parseTopLinks(settings.menu_header)
  const drawerSections = parseDrawerSections(settings.menu_drawer_json)

  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        <HeaderScripts />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/* Live brand colors from Admin → Settings → Colors. Loads after
            globals.css so these custom-property values win without a rebuild. */}
        <style id="brand-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body
        className={`${inter.className} antialiased min-h-screen flex flex-col overflow-x-hidden max-w-[100vw]`}
      >
        <Providers>
          <Navbar topLinks={topLinks} drawerSections={drawerSections} />
          <AdSlot slot="header" />
          <div className="flex-1 w-full min-w-0 overflow-x-hidden">{children}</div>
          <ConditionalFooter>
            <SiteFooter />
          </ConditionalFooter>
          <FooterScripts />
        </Providers>
      </body>
    </html>
  )
}
