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

      <!-- Header -->
      <header class="shrink-0 px-[5vw] pt-5 pb-4 border-b"
        style="border-color: color-mix(in srgb, var(--c-border) 50%, transparent);">

        <!-- Row 1: back + edit -->
        <div class="flex items-center justify-between mb-3">
          <button
            class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
            @click="$router.push('/')"
          >
            <ArrowLeftIcon :size="15" />
            返回
          </button>
          <div class="flex items-center gap-2">
            <router-link
              :to="`/edit/${store.currentPost!.id}`"
              class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
            >
              <PencilIcon :size="14" />
              編輯
            </router-link>
            <button
              class="card-aged text-inkMuted hover:text-ink flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body cursor-pointer transition-colors duration-200"
              @click="showExportModal = true"
            >
              <DownloadIcon :size="14" />
              匯出
            </button>
          </div>
        </div>

        <!-- Row 2: label + title -->
        <p class="text-[10px] font-body tracking-[0.25em] uppercase mb-1" style="color: var(--c-primary); opacity: 0.6;">
          Expedition Record
        </p>
        <h1 class="font-heading text-2xl sm:text-3xl font-bold text-ink leading-tight mb-3">
          {{ store.currentPost.title }}
        </h1>

        <!-- Row 3: meta chips -->
        <div v-if="hasMeta" class="flex flex-wrap items-center gap-2">
          <div v-if="dateRange" class="meta-chip">
            <CalendarIcon :size="11" class="meta-chip-icon" />
            <span class="font-mono text-[11px]">{{ dateRange }}</span>
          </div>
          <div v-if="tripDays" class="meta-chip">
            <SunriseIcon :size="11" class="meta-chip-icon" />
            <span>{{ tripDays }} 天</span>
          </div>
          <div v-if="store.currentPost.weather" class="meta-chip">
            <CloudIcon :size="11" class="meta-chip-icon" />
            <span>{{ store.currentPost.weather }}</span>
          </div>
          <div v-if="store.currentPost.peopleCount" class="meta-chip">
            <UsersIcon :size="11" class="meta-chip-icon" />
            <span>{{ store.currentPost.peopleCount }} 人</span>
          </div>
        </div>
      </header>

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
            :class="activeTab !== 'gpx' ? 'overflow-y-auto p-6' : 'overflow-y-auto'"
          >
            <PhotoGallery
              v-if="activeTab === 'photos'"
              ref="galleryRef"
              :photos="store.currentPhotos"
            />

            <template v-else-if="activeTab === 'gpx'">
              <!-- Map (fixed height so Leaflet renders correctly) -->
              <GpxViewer
                ref="gpxViewerRef"
                style="height: 100vh;"
                :gpx-url="store.currentPost!.gpxFile"
                :show-peaks="showPeaks"
                :show-waypoints="showWaypoints"
                :show-shelters="showShelters"
                :overrides="store.currentWaypointOverrides"
                @waypoints-ready="gpxWaypoints = $event"
              />

              <!-- Waypoint list below the map -->
              <div v-if="gpxWaypoints.length > 0" class="p-6">
                <div class="flex items-center gap-2 mb-4">
                  <MapPinIcon :size="14" class="text-primary opacity-70" />
                  <span class="text-[10px] font-body uppercase tracking-[0.2em] text-inkMuted">記錄點</span>
                  <span class="font-mono text-[10px] text-inkMuted opacity-50">{{ gpxWaypoints.length }}</span>
                </div>

                <div class="flex gap-4 overflow-x-auto pb-2">
                  <div
                    v-for="([date, wpts]) in groupedWaypoints"
                    :key="date"
                    class="flex-none w-64 flex flex-col gap-3"
                  >
                    <!-- Date header -->
                    <p class="text-[10px] font-mono tracking-wider text-inkMuted opacity-60 pb-1"
                      style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
                      {{ date }}
                    </p>

                    <!-- Waypoint cards for this date -->
                    <div
                      v-for="(wpt, i) in wpts"
                      :key="i"
                      class="card-aged rounded-xl p-4 space-y-2.5 cursor-pointer hover:ring-1 transition-all duration-150"
                      style="--tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                      @click="openWptEdit(wpt)"
                    >
                      <p class="font-heading text-sm font-semibold text-ink leading-snug truncate">
                        {{ wpt.name || '未命名' }}
                      </p>
                      <p v-if="wpt.desc" class="text-[11px] font-body text-inkMuted italic leading-relaxed">
                        {{ wpt.desc }}
                      </p>
                      <div class="flex flex-wrap gap-1.5">
                        <span v-if="wpt.ele !== null"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px]"
                          style="background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-primary);">
                          {{ wpt.ele }} m
                        </span>
                        <span
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] text-inkMuted"
                          style="background: color-mix(in srgb, var(--c-surface) 60%, transparent);">
                          {{ wpt.lat.toFixed(5) }}, {{ wpt.lng.toFixed(5) }}
                        </span>
                      </div>
                      <p v-if="wpt.time" class="text-[10px] font-mono text-inkMuted opacity-60">
                        {{ formatWptTime(wpt.time) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </template>

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
              <div v-if="store.currentPost.peopleCount" class="meta-item">
                <UsersIcon :size="13" class="meta-icon" />
                <span class="meta-label">人數</span>
                <span class="meta-value">{{ store.currentPost.peopleCount }} 人</span>
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

    <!-- ── Waypoint Edit Modal ──────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="export-fade">
        <div
          v-if="editingWpt"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
          @click.self="editingWpt = null"
          @keydown.esc="editingWpt = null"
        >
          <div class="card-aged rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">

            <!-- Header -->
            <div class="flex items-center gap-2.5">
              <MapPinIcon :size="15" class="text-primary opacity-80" />
              <span class="font-heading text-lg text-ink tracking-wide">編輯記錄點</span>
            </div>

            <!-- Read-only info chips -->
            <div class="flex flex-wrap gap-1.5">
              <span v-if="editingWpt.ele !== null"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px]"
                style="background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-primary);">
                {{ editingWpt.ele }} m
              </span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] text-inkMuted"
                style="background: color-mix(in srgb, var(--c-surface) 60%, transparent);">
                {{ editingWpt.lat.toFixed(5) }}, {{ editingWpt.lng.toFixed(5) }}
              </span>
              <span v-if="editingWpt.time"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] text-inkMuted"
                style="background: color-mix(in srgb, var(--c-surface) 60%, transparent);">
                {{ formatWptTime(editingWpt.time) }}
              </span>
            </div>

            <!-- Name field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">名稱</label>
              <input
                v-model="wptDraft.name"
                class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="記錄點名稱"
                @keydown.enter="saveWptEdit"
              />
            </div>

            <!-- Desc field -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted">描述</label>
              <textarea
                v-model="wptDraft.desc"
                rows="3"
                class="w-full rounded-lg px-3 py-2 text-sm font-body text-ink bg-transparent border outline-none focus:ring-1 transition-all duration-150 resize-none"
                style="border-color: var(--c-border); --tw-ring-color: color-mix(in srgb, var(--c-primary) 40%, transparent);"
                placeholder="備註說明"
              />
            </div>

            <!-- Error message -->
            <p v-if="wptError" class="text-xs font-body text-red-400">{{ wptError }}</p>

            <!-- Footer buttons -->
            <div class="flex gap-2 pt-1">
              <button
                class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
                style="color: var(--c-inkMuted); border-color: var(--c-border);"
                :disabled="wptSaving"
                @click="editingWpt = null"
              >取消</button>
              <button
                class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150 flex items-center justify-center gap-2"
                :disabled="wptSaving"
                @click="saveWptEdit"
              >
                <div v-if="wptSaving" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {{ wptSaving ? '儲存中…' : '儲存' }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Export Modal ─────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="export-fade">
        <div
          v-if="showExportModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
          @click.self="showExportModal = false"
          @keydown.esc="showExportModal = false"
        >
          <div class="card-aged rounded-xl p-6 w-full max-w-sm shadow-xl">

            <!-- Header -->
            <div class="flex items-center gap-2.5 mb-5">
              <DownloadIcon :size="16" class="text-primary" />
              <span class="font-heading text-lg text-ink tracking-wide">匯出記錄</span>
            </div>

            <!-- Format selection -->
            <p class="text-[10px] font-body uppercase tracking-[0.18em] text-inkMuted mb-2.5">匯出格式</p>
            <div class="flex gap-2 mb-5">
              <button
                v-for="fmt in (['json', 'pdf'] as const)"
                :key="fmt"
                class="flex-1 py-2 rounded-lg text-sm font-mono font-semibold border cursor-pointer transition-all duration-150"
                :style="exportFormat === fmt
                  ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                  : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
                @click="exportFormat = fmt"
              >
                .{{ fmt }}
              </button>
            </div>

            <!-- Include gears toggle -->
            <label class="flex items-center gap-3 cursor-pointer select-none mb-6 group">
              <div
                class="w-10 h-5 rounded-full relative transition-colors duration-200 shrink-0"
                :style="includeGears
                  ? 'background: var(--c-primary);'
                  : 'background: color-mix(in srgb, var(--c-border) 80%, transparent);'"
                @click="includeGears = !includeGears"
              >
                <div
                  class="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                  :style="`background: var(--c-base); box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: translateX(${includeGears ? 20 : 2}px);`"
                />
              </div>
              <span class="text-sm font-body text-ink">匯出裝備清單</span>
            </label>

            <!-- Footer buttons -->
            <div class="flex gap-2">
              <button
                class="flex-1 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150 border"
                style="color: var(--c-inkMuted); border-color: var(--c-border);"
                @click="showExportModal = false"
              >
                取消
              </button>
              <button
                class="flex-1 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer btn-cta transition-colors duration-150"
                @click="doExport"
              >
                匯出
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

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
  StarOff as StarOffIcon, Download as DownloadIcon,
} from 'lucide-vue-next'
import PhotoGallery from '../components/PhotoGallery.vue'
import GpxViewer from '../components/GpxViewer.vue'
import GearList from '../components/GearList.vue'
import { usePostStore } from '../stores/postStore'
import type { Waypoint } from '../types'

const route = useRoute()
const store = usePostStore()

const activeTab    = ref('photos')
const sidebarOpen   = ref(false)
const galleryRef    = ref<InstanceType<typeof PhotoGallery> | null>(null)
const gpxViewerRef  = ref<InstanceType<typeof GpxViewer> | null>(null)

function setTab(key: string) {
  if (key === 'gpx') sidebarOpen.value = false
  activeTab.value = key
}
const showPeaks     = ref(true)
const showWaypoints = ref(true)
const showShelters  = ref(false)
const gpxWaypoints  = ref<Waypoint[]>([])

// ── Waypoint edit ─────────────────────────────────────────────────
const editingWpt  = ref<Waypoint | null>(null)
const wptDraft    = ref({ name: '', desc: '' })
const wptSaving   = ref(false)
const wptError    = ref<string | null>(null)

function openWptEdit(wpt: Waypoint) {
  editingWpt.value = wpt
  wptDraft.value   = { name: wpt.name, desc: wpt.desc }
  wptError.value   = null
}

async function saveWptEdit() {
  if (!editingWpt.value || wptSaving.value) return
  const wpt  = editingWpt.value
  const post = store.currentPost!
  wptSaving.value = true
  wptError.value  = null

  try {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    const res = await fetch(`${apiBase}/api/Gpx/${post.id}/waypoint`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ lat: wpt.lat, lng: wpt.lng, name: wptDraft.value.name, desc: wptDraft.value.desc }),
    })
    if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)

    wpt.name = wptDraft.value.name
    wpt.desc = wptDraft.value.desc
    gpxViewerRef.value?.updateWaypoint(wpt.lat, wpt.lng, wpt.name, wpt.desc)

    const existing = store.currentWaypointOverrides.find(
      o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5
    )
    if (existing) { existing.name = wpt.name; existing.description = wpt.desc }
    else store.currentWaypointOverrides.push({ lat: wpt.lat, lng: wpt.lng, name: wpt.name, description: wpt.desc })

    editingWpt.value = null
  } catch (e) {
    wptError.value = (e as Error).message
  } finally {
    wptSaving.value = false
  }
}

const sortedWaypoints = computed(() =>
  [...gpxWaypoints.value].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.getTime() - b.time.getTime()
  })
)

const groupedWaypoints = computed(() => {
  const map = new Map<string, Waypoint[]>()
  for (const wpt of sortedWaypoints.value) {
    const key = wpt.time
      ? wpt.time.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : '未知日期'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(wpt)
  }
  return [...map.entries()]
})

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

function fmtDate(iso: string) {
  const d = iso.slice(0, 10)
  return `${d.slice(0, 4)}/${d.slice(5, 7)}/${d.slice(8, 10)}`
}

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
  return !!(dateRange.value || p?.weather || p?.peopleCount)
})

onMounted(() => store.fetchPostDetail(route.params.id as string))

// ── Export ────────────────────────────────────────────────────────
const showExportModal = ref(false)
const exportFormat    = ref<'json' | 'pdf'>('json')
const includeGears    = ref(true)

function doExport() {
  showExportModal.value = false
  if (exportFormat.value === 'json') exportAsJson()
  else void exportAsPdf()
}

function exportAsJson() {
  const p = store.currentPost!
  const data: Record<string, unknown> = {
    title:       p.title,
    description: p.description ?? null,
    dateStart:   p.dateStart   ?? null,
    dateEnd:     p.dateEnd     ?? null,
    weather:     p.weather     ?? null,
    peopleCount: p.peopleCount ?? null,
    tags:        p.tags        ?? [],
    photos:      store.currentPhotos.map(ph => ph.url),
  }
  if (includeGears.value) {
    data.gears = store.currentGears.map(g => ({
      name:     g.name,
      category: g.category,
      brand:    g.brand     ?? null,
      weight:   g.weight,
      quantity: g.quantity,
      note:     g.note      || null,
    }))
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `${safeFilename(p.title)}.json` })
  a.click()
  URL.revokeObjectURL(url)
}

async function exportAsPdf() {
  const p       = store.currentPost!
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
  const url     = `${apiBase}/api/Posts/${p.id}/export/pdf?includeGears=${includeGears.value}`

  const res = await fetch(url)
  if (!res.ok) {
    console.error('PDF export failed:', res.status, await res.text())
    return
  }

  const blob     = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a        = Object.assign(document.createElement('a'), {
    href:     objectUrl,
    download: `${safeFilename(p.title)}.pdf`,
  })
  a.click()
  URL.revokeObjectURL(objectUrl)
}

function safeFilename(s: string) {
  return s.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'export'
}

function formatWptTime(d: Date) {
  return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
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

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid color-mix(in srgb, var(--c-border) 80%, transparent);
  background: color-mix(in srgb, var(--c-primary) 6%, transparent);
  font-family: Inter, sans-serif;
  font-size: 11px;
  color: var(--c-inkMuted);
}
.meta-chip-icon { color: var(--c-primary); opacity: 0.8; flex-shrink: 0; }

.export-fade-enter-active,
.export-fade-leave-active { transition: opacity 0.15s ease; }
.export-fade-enter-from,
.export-fade-leave-to    { opacity: 0; }
</style>
