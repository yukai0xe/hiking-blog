import { ref, computed, watch } from 'vue'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import { useProfileStore } from '../stores/profileStore'
import type { GpxLibraryEntry } from '../types'

type GridItem =
  | { type: 'card';    entry: GpxLibraryEntry }
  | { type: 'divider'; label: string; count: number; isWishlist: boolean }

export type { GridItem }

const search         = ref('')
const filterStars    = ref<number[]>([])
const filterTags     = ref<string[]>([])
const wishlistFilter = ref<'all' | 'wishlist' | 'done'>('all')
const showFilterPanel = ref(false)

let _watchInitialized = false

export function useGpxFilter() {
  const store   = useGpxLibraryStore()
  const profile = useProfileStore()

  if (!_watchInitialized) {
    _watchInitialized = true
    watch(() => profile.difficultyMax, (max) => {
      filterStars.value = filterStars.value.filter(n => n <= max)
    })
  }

  const activeFilterCount = computed(() => filterStars.value.length + filterTags.value.length)

  const hasActiveFilter = computed(() =>
    !!search.value.trim() || activeFilterCount.value > 0 || wishlistFilter.value !== 'all'
  )

  const filteredBase = computed(() => {
    const q = search.value.trim().toLowerCase()
    return store.gpxLibrary.filter(e => {
      if (q && !e.name.toLowerCase().includes(q)) return false
      if (filterStars.value.length && !filterStars.value.includes(e.difficultyStars ?? 0)) return false
      if (filterTags.value.length && !filterTags.value.some(t => e.tags?.includes(t))) return false
      return true
    })
  })

  const filteredWishlist = computed(() => filteredBase.value.filter(e =>  e.isWishlist))
  const filteredDone     = computed(() => filteredBase.value.filter(e => !e.isWishlist))

  const filtered = computed(() => {
    if (wishlistFilter.value === 'wishlist') return filteredWishlist.value
    if (wishlistFilter.value === 'done')     return filteredDone.value
    return filteredBase.value
  })

  const groupedFiltered = computed((): GridItem[] => {
    if (wishlistFilter.value !== 'all') {
      return filtered.value.map(e => ({ type: 'card', entry: e }))
    }
    const items: GridItem[] = []
    if (filteredWishlist.value.length) {
      items.push({ type: 'divider', label: '願望清單', count: filteredWishlist.value.length, isWishlist: true })
      filteredWishlist.value.forEach(e => items.push({ type: 'card', entry: e }))
    }
    if (filteredDone.value.length) {
      items.push({ type: 'divider', label: '其他路線', count: filteredDone.value.length, isWishlist: false })
      filteredDone.value.forEach(e => items.push({ type: 'card', entry: e }))
    }
    return items
  })

  function toggleStars(n: number) {
    const i = filterStars.value.indexOf(n)
    filterStars.value = i === -1
      ? [...filterStars.value, n]
      : filterStars.value.filter(s => s !== n)
  }

  function toggleTag(tag: string) {
    const i = filterTags.value.indexOf(tag)
    filterTags.value = i === -1
      ? [...filterTags.value, tag]
      : filterTags.value.filter(t => t !== tag)
  }

  function clearFilters() {
    search.value         = ''
    filterStars.value    = []
    filterTags.value     = []
    wishlistFilter.value = 'all'
  }

  return {
    search, filterStars, filterTags, wishlistFilter, showFilterPanel,
    activeFilterCount, hasActiveFilter,
    filteredBase, filteredWishlist, filteredDone, filtered, groupedFiltered,
    toggleStars, toggleTag, clearFilters,
  }
}
