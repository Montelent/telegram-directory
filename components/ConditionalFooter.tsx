'use client'

import { usePathname } from 'next/navigation'

export default function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Hide only on admin (dashboard uses the global site footer)
  if (pathname?.startsWith('/admin')) {
    return null
  }
  return <>{children}</>
}
