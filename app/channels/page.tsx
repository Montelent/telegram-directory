import { redirect } from 'next/navigation'

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const p = new URLSearchParams()
  p.set('type', 'CHANNEL')
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== 'type') p.set(k, v)
  }
  redirect('/explore?' + p.toString())
}
