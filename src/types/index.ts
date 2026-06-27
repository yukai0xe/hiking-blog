export interface Post {
  id: string
  title: string
  coverImage: string
  gpxFile: string
  description: string
  created_at: string
  dateStart?: string | null
  dateEnd?: string | null
  weather?: string | null
  peopleCount?: number | null
  deletedAt?: string | null
  tags?: string[] | null
  compressedCoverImage?: string | null
  showGpx?: boolean | null
  showGears?: boolean | null
  showFoods?: boolean | null
  gpxDescription?: string | null
  isPublic?: boolean | null
  difficultyStars?: number | null
}

export interface Photo {
  id: string
  postId: string
  url: string
  created_at: string
}

export type GearCategory = string
export type GearStatus = 'owned' | 'wishlist' | 'abandon' | 'other'

export interface Gear {
  id: string       // gears_mapping_post.id (mapping row)
  gearId: string   // gears.id (library entry)
  postId: string
  name: string
  weight: number
  note: string
  category: GearCategory
  quantity: number
  brand?: string | null
  referenceUrl?: string | null
  price?: number | null
  addedAt?: string | null
  isWishlist?: boolean
  status?: GearStatus
  description?: string | null
}

export interface GearImage {
  id:  string
  url: string
}

export interface WaypointOverride {
  lat: number
  lng: number
  name: string
  description: string
  isCustom: boolean
  hidden: boolean
  time?: string | null
}

export interface Waypoint {
  name:    string
  desc:    string
  lat:     number
  lng:     number
  ele:     number | null
  time:    Date | null
  hidden?: boolean
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

export type GearDraft = {
  name: string;
  weight: number;
  note: string;
  category: GearCategory;
  quantity: number;
  brand: string;
  referenceUrl: string;
  price: number | null;
  addedAt: string;
  _libraryId?: string
}

export interface Food {
  id:            string
  postId:        string
  name:          string
  weight:        number
  quantity:      number
  note:          string
  referenceUrl?: string | null
  price?:        number | null
}

export type FoodDraft = {
  id?:          string
  name:         string
  weight:       number
  quantity:     number
  note:         string
  referenceUrl: string
  price:        number | null
}

export interface FoodDayAssignment {
  id:       string
  postId:   string
  foodId:   string
  dayIndex: number
}

export interface PostGpxRecord {
  id:          string
  postId:      string
  name:        string
  description: string
  gpxFileUrl:  string
  createdAt:   string
}

export interface GpxLibraryEntry {
  id:              string
  name:            string
  gpxFileUrl:      string
  date?:           string | null
  difficultyStars?: number | null
  peopleCount?:    number | null
  referenceUrl?:   string | null
  tags?:           string[] | null
  isWishlist?:     boolean
  sortOrder?:      number
  createdAt:       string
}

export interface NoteGroup {
  id:          string
  name:        string
  description: string | null
  sortOrder:   number
  createdAt:   string
}

export interface NoteLink {
  id:            string
  groupId:       string | null
  url:           string
  title:         string
  coverImageUrl: string | null
  sortOrder:     number
  createdAt:     string
  deletedAt?:    string | null
}
