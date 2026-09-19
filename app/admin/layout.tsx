// Temporary public layout for admin.
// TODO: Protect with NextAuth middleware once auth is configured.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
