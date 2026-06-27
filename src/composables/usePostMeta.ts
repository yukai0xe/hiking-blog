import { ref, computed } from 'vue'
import {
  Camera as CameraIcon, Map as MapIcon, Backpack as BackpackIcon, UtensilsCrossed as FoodIcon,
  Triangle as TriangleIcon, MapPin as MapPinIcon, Home as HomeIcon,
} from 'lucide-vue-next'
import { usePostStore } from '../stores/postStore'
import { fmtDate } from '../utils/gpxHelpers'

export function usePostMeta() {
  const store = usePostStore()

  const activeTab    = ref('photos')
  const sidebarOpen  = ref(false)
  const foodEditMode = ref(false)
  const gearEditMode = ref(false)
  const showPeaks     = ref(true)
  const showWaypoints = ref(true)
  const showShelters  = ref(false)

  function setTab(key: string) {
    if (key === 'gpx') {
      sidebarOpen.value = false
      if (store.currentPost) store.fetchGpxRecords(store.currentPost.id)
    }
    if (key !== 'foods') foodEditMode.value = false
    if (key !== 'gears') gearEditMode.value = false
    activeTab.value = key
  }

  const navTabs = computed(() => {
    const p = store.currentPost
    const tabs = [{ key: 'photos', label: '照片', icon: CameraIcon }]
    if (!p || p.showGpx  !== false) tabs.push({ key: 'gpx',   label: '地圖', icon: MapIcon })
    if (!p || p.showGears !== false) tabs.push({ key: 'gears', label: '裝備', icon: BackpackIcon })
    if (!p || p.showFoods !== false) tabs.push({ key: 'foods', label: '糧食', icon: FoodIcon })
    return tabs
  })

  const mapToggles = [
    { key: 'peaks',     label: '山頭',   icon: TriangleIcon, active: showPeaks },
    { key: 'waypoints', label: '記錄點', icon: MapPinIcon,   active: showWaypoints },
    { key: 'shelters',  label: '山屋',   icon: HomeIcon,     active: showShelters },
  ]

  const dateRange = computed(() => {
    const p = store.currentPost
    if (!p) return ''
    if (p.dateStart && p.dateEnd && p.dateEnd !== p.dateStart)
      return `${fmtDate(p.dateStart)} – ${fmtDate(p.dateEnd)}`
    if (p.dateStart) return fmtDate(p.dateStart)
    return ''
  })

  const tripDays = computed(() => {
    const p = store.currentPost
    if (!p?.dateStart || !p.dateEnd) return null
    const diff = Math.round(
      (new Date(p.dateEnd).getTime() - new Date(p.dateStart).getTime()) / 86400000
    )
    return Math.max(1, diff + 1)
  })

  const hasMeta = computed(() => {
    const p = store.currentPost
    return !!(dateRange.value || p?.weather || p?.peopleCount || p?.difficultyStars)
  })

  return {
    activeTab, sidebarOpen, foodEditMode, gearEditMode,
    showPeaks, showWaypoints, showShelters,
    setTab, navTabs, mapToggles,
    dateRange, tripDays, hasMeta,
  }
}
