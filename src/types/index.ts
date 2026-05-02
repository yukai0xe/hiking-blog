export interface Post {
  id: string
  title: string
  cover_image: string
  gpx_file: string
  description: string
  created_at: string
  date_start?:    string | null
  date_end?:      string | null
  weather?:       string | null
  people_count?:  number | null
  deleted_at?:    string | null
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
