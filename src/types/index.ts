export interface Post {
  id: string
  title: string
  coverImage: string
  gpxFile: string
  description: string
  created_at: string
  dateStart?:    string | null
  dateEnd?:      string | null
  weather?:       string | null
  peopleCount?:  number | null
  deletedAt?:    string | null
  tags?:          string[] | null
  compressedCoverImage?: string | null
}

export interface Photo {
  id: string
  post_id: string
  url: string
  created_at: string
}

export const GEAR_CATEGORIES = [
  '背負系統', '服裝', '營帳', '烹飪器具', '電子設備', '醫療用品', '其他',
] as const
export type GearCategory = typeof GEAR_CATEGORIES[number]

export interface Gear {
  id: string
  post_id: string
  name: string
  weight: number
  note: string
  category: GearCategory
  quantity: number
}

export interface GpxData {
  coordinates: [number, number][]
  elevation: number[]
  timestamps: Date[]
}

export interface ElevationStats {
  totalAscent: number
  maxElevation: number
  minElevation: number
}
