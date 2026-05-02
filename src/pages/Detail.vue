<template>
  <div class="min-h-screen flex flex-col textured-bg vignette">

    <div v-if="store.loading" class="flex items-center justify-center flex-1">
      <div class="card-aged px-8 py-5 flex items-center gap-3 font-body text-inkMuted">
        <div class="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
        載入中…
      </div>
    </div>

    <div v-else-if="store.error" class="flex-1 flex items-center justify-center font-body" style="color: #e07070;">
      {{ store.error }}
    </div>

    <template v-else-if="store.currentPost">

      <!-- Hero -->
      <div class="relative h-64 sm:h-[340px] shrink-0 overflow-hidden">
        <img
          :src="store.currentPost.cover_image"
          :alt="store.currentPost.title"
          class="w-full h-full object-cover"
          style="opacity: 0.65; filter: sepia(0.2) contrast(1.05);"
        />
        <div class="absolute inset-0" style="background: linear-gradient(to top, #0A0908 0%, rgba(10,9,8,0.3) 50%, transparent 100%);" />

        <!-- Back + Edit -->
        <div class="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <button
            class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
            @click="$router.push('/')"
          >
            <ArrowLeftIcon :size="15" />
            返回
          </button>
          <router-link
            :to="`/edit/${store.currentPost!.id}`"
            class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
          >
            <PencilIcon :size="14" />
          </router-link>
        </div>

        <!-- Title -->
        <div class="absolute bottom-0 left-0 right-0 px-6 pb-5 z-10">
          <p class="text-xs font-body tracking-[0.25em] uppercase mb-1.5" style="color: #c6ac8f80;">
            Expedition Record
          </p>
          <h1 class="font-heading text-2xl sm:text-4xl font-bold text-ink leading-tight">
            {{ store.currentPost.title }}
          </h1>
          <p class="text-xs mt-1.5 font-body tracking-wide text-inkMuted">
            {{ formatDate(store.currentPost.created_at) }}
          </p>
        </div>
      </div>

      <!-- Three-column layout -->
      <div class="relative z-10 flex flex-1 overflow-hidden px-[5vw] pt-6 pb-[30vh]">

        <!-- ① Left sidebar — tab navigation -->
        <nav
          class="w-[72px] shrink-0 flex flex-col pt-5 pb-4 gap-1 pr-3"
          style="border-right: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);"
        >
          <button
            v-for="nav in navTabs"
            :key="nav.key"
            class="relative flex flex-col items-center gap-1.5 py-3 transition-all duration-200 cursor-pointer rounded-r-sm"
            :style="activeTab === nav.key ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'"
            @click="setTab(nav.key)"
          >
            <!-- Left indicator line -->
            <span
              v-if="activeTab === nav.key"
              class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
              style="background: var(--c-primary);"
            />
            <component :is="nav.icon" :size="18" />
            <span class="text-[10px] font-body tracking-wide">{{ nav.label }}</span>
          </button>
        </nav>

        <!-- ② Center — main content -->
        <main class="flex-1 flex flex-col overflow-hidden relative">

          <!-- Top bar: always visible -->
          <div class="shrink-0"
            style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);">

            <!-- Row 1: tags + right actions -->
            <div class="flex items-center gap-2 px-4 py-2 flex-wrap">
              <!-- Tags (always, left side) -->
              <template v-if="store.currentPost?.tags?.length">
                <span
                  v-for="tag in store.currentPost.tags"
                  :key="tag"
                  class="px-2.5 py-1 rounded-full text-[10px] font-body tracking-wide border"
                  style="color: var(--c-primary); border-color: color-mix(in srgb, var(--c-primary) 35%, transparent); background: color-mix(in srgb, var(--c-primary) 8%, transparent);"
                >{{ tag }}</span>
              </template>

              <!-- Right-side actions -->
              <div class="ml-auto flex items-center gap-2 shrink-0">
                <!-- Reset favourites (photos tab only) -->
                <button
                  v-if="activeTab === 'photos' && galleryRef?.hasFavorites"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="galleryRef?.resetFavorites()"
                >
                  <StarOffIcon :size="12" />
                  重置喜愛
                </button>

                <!-- Sidebar collapse toggle -->
                <button
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                  style="color: var(--c-inkMuted); border: 1px solid var(--c-border);"
                  @click="sidebarOpen = !sidebarOpen"
                >
                  <template v-if="sidebarOpen">
                    <ChevronsRightIcon :size="13" />
                    <span>收起</span>
                  </template>
                  <template v-else>
                    <ChevronsLeftIcon :size="13" />
                    <span>行程資訊</span>
                  </template>
                </button>
              </div>
            </div>

            <!-- Row 2: map layer toggles (gpx only) -->
            <div
              v-if="activeTab === 'gpx'"
              class="flex items-center gap-2 px-4 py-2"
              style="border-top: 1px solid color-mix(in srgb, var(--c-border) 30%, transparent);"
            >
              <button
                v-for="tog in mapToggles"
                :key="tog.key"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body cursor-pointer transition-colors duration-150"
                :style="tog.active.value
                  ? 'background: var(--c-primary); color: var(--c-base); border: 1px solid var(--c-primary);'
                  : 'background: transparent; color: var(--c-inkMuted); border: 1px solid var(--c-border);'"
                @click="tog.active.value = !tog.active.value"
              >
                <component :is="tog.icon" :size="12" />
                {{ tog.label }}
              </button>
            </div>
          </div>

          <!-- Content area -->
          <div
            class="flex-1 min-h-0"
            :class="activeTab !== 'gpx' ? 'overflow-y-auto p-6' : ''"
          >
            <PhotoGallery
              v-if="activeTab === 'photos'"
              ref="galleryRef"
              :photos="store.currentPhotos"
            />

            <GpxViewer
              v-else-if="activeTab === 'gpx'"
              style="height: 100vh;"
              :gpx-url="store.currentPost!.gpx_file"
              :show-peaks="showPeaks"
              :show-waypoints="showWaypoints"
              :show-shelters="showShelters"
            />

            <GearList
              v-else-if="activeTab === 'gears'"
              :gears="store.currentGears"
            />
          </div>
        </main>

        <!-- ③ Right sidebar — trip info (collapsible) -->
        <aside
          class="shrink-0 overflow-hidden transition-[width] duration-300"
          :style="`width: ${sidebarOpen ? '240px' : '0px'}; border-left: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);`"
        >
        <div class="w-[240px] overflow-y-auto p-5 h-full">
          <!-- Meta info -->
          <div v-if="hasMeta" class="mb-5">
            <p class="text-[9px] font-body uppercase tracking-[0.2em] text-inkMuted opacity-50 mb-3">行程資訊</p>
            <div class="space-y-2.5">
              <div v-if="dateRange" class="meta-item">
                <CalendarIcon :size="13" class="meta-icon" />
                <span class="meta-value font-mono text-xs">{{ dateRange }}</span>
              </div>
              <div v-if="tripDays" class="meta-item">
                <SunriseIcon :size="13" class="meta-icon" />
                <span class="meta-label">天數</span>
                <span class="meta-value">{{ tripDays }} 天</span>
              </div>
              <div v-if="store.currentPost.weather" class="meta-item">
                <CloudIcon :size="13" class="meta-icon" />
                <span class="meta-label">天氣</span>
                <span class="meta-value">{{ store.currentPost.weather }}</span>
              </div>
              <div v-if="store.currentPost.people_count" class="meta-item">
                <UsersIcon :size="13" class="meta-icon" />
                <span class="meta-label">人數</span>
                <span class="meta-value">{{ store.currentPost.people_count }} 人</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div
            v-if="store.currentPost.description"
            :class="hasMeta ? 'pt-5' : ''"
            :style="hasMeta ? 'border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);' : ''"
          >
            <p class="text-[9px] font-body uppercase tracking-[0.2em] text-inkMuted opacity-50 mb-3">描述</p>
            <p class="text-sm font-body italic text-inkMuted leading-relaxed">
              {{ store.currentPost.description }}
            </p>
          </div>
        </div>
        </aside>

      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon, Pencil as PencilIcon,
  Camera as CameraIcon, Map as MapIcon, Backpack as BackpackIcon,
  Triangle as TriangleIcon, MapPin as MapPinIcon, Home as HomeIcon,
  Calendar as CalendarIcon, Sunrise as SunriseIcon,
  Cloud as CloudIcon, Users as UsersIcon,
  ChevronsRight as ChevronsRightIcon, ChevronsLeft as ChevronsLeftIcon,
  StarOff as StarOffIcon,
} from 'lucide-vue-next'
import PhotoGallery from '../components/PhotoGallery.vue'
import GpxViewer from '../components/GpxViewer.vue'
import GearList from '../components/GearList.vue'
import { usePostStore } from '../stores/postStore'

const route = useRoute()
const store = usePostStore()

const activeTab    = ref('photos')
const sidebarOpen   = ref(false)
const galleryRef    = ref<InstanceType<typeof PhotoGallery> | null>(null)

function setTab(key: string) {
  if (key === 'gpx') sidebarOpen.value = false
  activeTab.value = key
}
const showPeaks     = ref(true)
const showWaypoints = ref(true)
const showShelters  = ref(false)

const navTabs = [
  { key: 'photos', label: '照片', icon: CameraIcon },
  { key: 'gpx',    label: '地圖', icon: MapIcon },
  { key: 'gears',  label: '裝備', icon: BackpackIcon },
]

const mapToggles = [
  { key: 'peaks',     label: '山頭',    icon: TriangleIcon, active: showPeaks },
  { key: 'waypoints', label: '記錄點',  icon: MapPinIcon,   active: showWaypoints },
  { key: 'shelters',  label: '山屋',    icon: HomeIcon,     active: showShelters },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function fmtDate(iso: string) {
  const d = iso.slice(0, 10)
  return `${d.slice(0, 4)}/${d.slice(5, 7)}/${d.slice(8, 10)}`
}

const dateRange = computed(() => {
  const p = store.currentPost
  if (!p) return ''
  if (p.date_start && p.date_end && p.date_end !== p.date_start)
    return `${fmtDate(p.date_start)} – ${fmtDate(p.date_end)}`
  if (p.date_start) return fmtDate(p.date_start)
  return ''
})

const tripDays = computed(() => {
  const p = store.currentPost
  if (!p?.date_start || !p.date_end) return null
  const diff = Math.round(
    (new Date(p.date_end).getTime() - new Date(p.date_start).getTime()) / 86400000
  )
  return Math.max(1, diff + 1)
})

const hasMeta = computed(() => {
  const p = store.currentPost
  return !!(dateRange.value || p?.weather || p?.people_count)
})

onMounted(() => store.fetchPostDetail(route.params.id as string))
</script>

<style scoped>
.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}
.meta-icon  { color: var(--c-primary); opacity: 0.75; flex-shrink: 0; }
.meta-label { font-family: Inter, sans-serif; color: var(--c-inkMuted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
.meta-value { font-family: Inter, sans-serif; color: var(--c-ink); font-weight: 500; }
</style>
