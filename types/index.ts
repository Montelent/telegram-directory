export type EntityType = 'GROUP' | 'CHANNEL'
export type EntityStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
}

export interface Entity {
  id: string
  username?: string | null
  title: string
  description?: string | null
  type: EntityType
  status: EntityStatus
  memberCount?: number | null
  language?: string | null
  country?: string | null
  inviteLink?: string | null
  photoUrl?: string | null
  isVerified: boolean
  isScam: boolean
  category?: Category | null
}
