import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import SiteFooter from '@/components/SiteFooter'
import ConditionalFooter from '@/components/ConditionalFooter'
import Providers from '@/components/Providers'
import { HeaderScripts, FooterScripts, AdSlot } from '@/components/SiteScripts'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Telegram Directory – Discover Public Groups & Channels',
  description: 'Search and browse public Telegram groups and channels by category, language, and more.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <HeaderScripts />
      </head>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <AdSlot slot="header" />
          <div className="flex-1">{children}</div>
          <ConditionalFooter>
            <SiteFooter />
          </ConditionalFooter>
          <FooterScripts />
        </Providers>
      </body>
    </html>
  )
}
