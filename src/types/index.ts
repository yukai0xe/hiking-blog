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
}

export interface Photo {
  id: string
  post_id: string
  url: string
  created_at: string
}

export interface Gear {
  id: string
  post_id: string
  name: string
  weight: number
  note: string
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
