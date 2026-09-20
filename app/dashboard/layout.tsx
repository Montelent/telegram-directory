import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UserDashboardShell from '@/components/UserDashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'user') {
    redirect('/login?callbackUrl=/dashboard')
  }

  return (
    <UserDashboardShell
      email={session.user?.email}
      name={session.user?.name}
    >
      {children}
    </UserDashboardShell>
  )
}
