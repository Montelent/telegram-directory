import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
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
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <Navbar />
          <AdSlot slot="header" />
          {children}
          <FooterScripts />
        </Providers>
      </body>
    </html>
  )
}
