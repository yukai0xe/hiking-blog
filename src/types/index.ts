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
  postId: string
  url: string
  created_at: string
}

export const GEAR_CATEGORIES = [
  '背負系統', '服裝', '營帳', '烹飪器具', '電子設備', '醫療用品', '其他',
] as const
export type GearCategory = typeof GEAR_CATEGORIES[number]

export interface Gear {
  id: string       // gears_mapping_post.id (mapping row)
  gearId: string   // gears.id (library entry)
  postId: string
  name: string
  weight: number
  note: string
  category: GearCategory
  quantity: number
  brand?:        string | null
  referenceUrl?: string | null
  price?:        number | null
  addedAt?:      string | null
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
