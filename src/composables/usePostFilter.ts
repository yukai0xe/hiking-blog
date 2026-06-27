import { ref, computed, watch } from 'vue'
import { usePostStore } from '../stores/postStore'
import { useProfileStore } from '../stores/profileStore'
import type { Post } from '../types'

// Module-level shared state — single instance across all callers in one app session
const filterWeather   = ref<string>('')
const filterDays      = ref<string>('')
const filterDateStart = ref<string>('')
const filterDateEnd   = ref<string>('')
const filterStars     = ref<number[]>([])
const filterTags      = ref<string[]>([])
const showFilterPanel = ref(false)

let _watchInitialized = false

export function usePostFilter() {
  const store   = usePostStore()
  const profile = useProfileStore()

  // Guard ensures only one watcher is created regardless of how many times this is called
  if (!_watchInitialized) {
    _watchInitialized = true
    watch(() => profile.difficultyMax, (max) => {
      filterStars.value = filterStars.value.filter(n => n <= max)
    })
  }

  const activeFilterCount = computed(() =>
    filterStars.value.length + filterTags.value.length + (filterWeather.value ? 1 : 0)
  )

  const hasActiveFilters = computed(() =>
    !!(filterWeather.value || filterDays.value || filterDateStart.value || filterDateEnd.value ||
       filterStars.value.length || filterTags.value.length)
  )

  function toggleWeather(w: string) {
    filterWeather.value = filterWeather.value === w ? '' : w
  }

  function toggleStars(n: number) {
    const i = filterStars.value.indexOf(n)
    filterStars.value = i === -1 ? [...filterStars.value, n] : filterStars.value.filter(s => s !== n)
  }

  function toggleAllStars() {
    filterStars.value = filterStars.value.length === profile.difficultyMax
      ? []
      : Array.from({ length: profile.difficultyMax }, (_, i) => i + 1)
  }

  function toggleTag(tag: string) {
    const i = filterTags.value.indexOf(tag)
    filterTags.value = i === -1 ? [...filterTags.value, tag] : filterTags.value.filter(t => t !== tag)
  }

  function toggleAllTags() {
    filterTags.value = filterTags.value.length === store.availableTags.length
      ? []
      : [...store.availableTags]
  }

  function clearFilters() {
    filterWeather.value   = ''
    filterDays.value      = ''
    filterDateStart.value = ''
    filterDateEnd.value   = ''
    filterStars.value     = []
    filterTags.value      = []
  }

  function calcDays(post: Post): number {
    if (!post.dateStart || !post.dateEnd) return 1
    const diff = Math.round(
      (new Date(post.dateEnd).getTime() - new Date(post.dateStart).getTime()) / 86400000
    )
    return Math.max(1, diff + 1)
  }

  const filteredPosts = computed(() =>
    store.posts.filter(post => {
      if (filterWeather.value && post.weather !== filterWeather.value) return false
      if (filterStars.value.length && !filterStars.value.includes(post.difficultyStars ?? 0)) return false
      if (filterTags.value.length && !filterTags.value.some(t => post.tags?.includes(t))) return false
      if (filterDays.value) {
        const d = calcDays(post)
        if (filterDays.value === '1'   && d !== 1)          return false
        if (filterDays.value === '2-3' && (d < 2 || d > 3)) return false
        if (filterDays.value === '4-7' && (d < 4 || d > 7)) return false
        if (filterDays.value === '7+'  && d <= 7)            return false
      }
      if (filterDateStart.value || filterDateEnd.value) {
        const d = (post.dateStart ?? post.created_at ?? '').slice(0, 10)
        if (filterDateStart.value && d < filterDateStart.value) return false
        if (filterDateEnd.value   && d > filterDateEnd.value)   return false
      }
      return true
    })
  )

  const filteredPublicPosts = computed(() => filteredPosts.value.filter(p => p.isPublic))
  const filteredDraftPosts  = computed(() => filteredPosts.value.filter(p => !p.isPublic))

  return {
    filterWeather, filterDays, filterDateStart, filterDateEnd,
    filterStars, filterTags, showFilterPanel,
    activeFilterCount, hasActiveFilters,
    filteredPosts, filteredPublicPosts, filteredDraftPosts,
    toggleWeather, toggleStars, toggleAllStars,
    toggleTag, toggleAllTags, clearFilters,
  }
}
