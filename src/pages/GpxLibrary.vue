<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 max-w-[1400px] mx-auto px-4">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-8">
        <button
          class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          @click="$router.back()" aria-label="返回"
        ><ArrowLeftIcon :size="17" /></button>
        <div class="flex-1">
          <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">GPX Library</p>
          <h1 class="font-heading text-xl font-bold text-ink">GPX 收藏</h1>
        </div>
        <button
          class="btn-cta flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer"
          @click="openCreate"
        ><PlusIcon :size="15" /> 新增 GPX</button>
      </div>

      <!-- Stats + search bar -->
      <div class="card-aged px-5 py-4 mb-6 flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-5 mr-auto flex-wrap">
          <div class="text-center">
            <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ store.gpxLibrary.length }}</p>
            <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">條路線</p>
          </div>
          <template v-for="(count, cat) in categoryCounts" :key="cat">
            <div class="w-px h-8 bg-border/40" />
            <div class="text-center">
              <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ count }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">{{ cat }}</p>
            </div>
          </template>
        </div>
        <div class="relative flex-1 min-w-[180px]">
          <SearchIcon :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-inkMuted pointer-events-none" />
          <input
            v-model="search"
            type="text"
            placeholder="搜尋路線名稱…"
            class="w-full pl-8 pr-8 py-2 rounded-lg text-sm font-body text-ink focus:outline-none focus:border-primary transition-colors"
            style="background: transparent; border: 1px solid var(--c-border);"
          />
          <button v-if="search" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-inkMuted hover:text-ink cursor-pointer" @click="search = ''">
            <XIcon :size="13" />
          </button>
        </div>

        <!-- Filter button -->
        <div class="relative">
          <button
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body transition-colors duration-150 cursor-pointer border"
            :style="showFilterPanel || activeFilterCount > 0
              ? 'border-color: var(--c-primary); color: var(--c-primary); background: color-mix(in srgb, var(--c-primary) 8%, transparent);'
              : 'border-color: var(--c-border); color: var(--c-inkMuted); background: transparent;'"
            @click="showFilterPanel = !showFilterPanel"
          >
            <SlidersHorizontalIcon :size="13" />
            更多篩選
            <span
              v-if="activeFilterCount > 0"
              class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
              style="background: var(--c-primary); color: var(--c-base);"
            >{{ activeFilterCount }}</span>
          </button>

          <!-- Backdrop -->
          <div v-if="showFilterPanel" class="fixed inset-0 z-10" @click="showFilterPanel = false" />

          <!-- Filter panel -->
          <Transition name="filter-panel">
            <div
              v-if="showFilterPanel"
              class="absolute right-0 mt-2 w-72 card-aged rounded-xl p-4 z-20 shadow-xl"
              style="border: 1px solid color-mix(in srgb, var(--c-border) 80%, transparent);"
            >
              <!-- Category -->
              <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted mb-2.5">山岳分類</p>
              <div class="flex flex-wrap gap-1.5 mb-4">
                <button
                  v-for="cat in CATEGORIES" :key="cat"
                  class="px-3 py-1 rounded-full text-xs font-body transition-colors duration-150 cursor-pointer border"
                  :style="filterCategory.includes(cat)
                    ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                    : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
                  @click="toggleCategory(cat)"
                >{{ cat }}</button>
              </div>

              <!-- Difficulty -->
              <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted mb-2.5">難度</p>
              <div class="flex flex-wrap gap-1.5 mb-4">
                <button
                  v-for="n in 5" :key="n"
                  class="px-2.5 py-1 rounded-full text-xs font-mono transition-colors duration-150 cursor-pointer border"
                  :style="filterStars.includes(n)
                    ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                    : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
                  @click="toggleStars(n)"
                >{{ '★'.repeat(n) }}</button>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between pt-3 border-t" style="border-color: var(--c-border);">
                <button
                  class="text-xs font-body text-inkMuted hover:text-ink transition-colors cursor-pointer disabled:opacity-30"
                  :disabled="!hasActiveFilter"
                  @click="clearFilters"
                >清除篩選</button>
                <button
                  class="px-3 py-1 rounded-lg text-xs font-body btn-cta cursor-pointer"
                  @click="showFilterPanel = false"
                >套用</button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Error banner -->
      <div v-if="apiError"
        class="mb-4 px-4 py-2.5 rounded-lg flex items-center gap-2 font-body text-sm"
        style="background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.35); color: #e07070;"
      >
        <AlertCircleIcon :size="14" class="shrink-0" />{{ apiError }}
      </div>

      <!-- Content area + editor panel -->
      <div class="flex gap-5 items-start">
        <div class="flex-1">

          <!-- Empty state -->
          <div v-if="store.gpxLibrary.length === 0 && !store.loading" class="card-aged p-16 text-center">
            <MapIcon :size="44" class="mx-auto mb-4 text-primary opacity-30" />
            <p class="font-heading text-xl text-ink mb-2">尚無 GPX 路線</p>
            <p class="text-sm font-body italic text-inkMuted mb-6">點擊「新增 GPX」上傳第一條路線</p>
            <button class="btn-cta inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer" @click="openCreate">
              <PlusIcon :size="14" /> 新增第一條路線
            </button>
          </div>

          <!-- No results after search/filter -->
          <div v-else-if="filtered.length === 0 && hasActiveFilter" class="card-aged p-12 text-center">
            <SearchIcon :size="36" class="mx-auto mb-4 text-primary opacity-30" />
            <p class="font-heading text-lg text-ink mb-2">無符合結果</p>
            <button class="text-sm font-body text-primary hover:opacity-70 cursor-pointer" @click="clearFilters">清除篩選</button>
          </div>

          <!-- Card grid -->
          <div v-else class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(200px, 350px));">
          <div
            v-for="entry in filtered" :key="entry.id"
            class="gpx-card cursor-pointer"
            style="max-width: 350px;"
            @click="openDetail(entry)"
          >
            <!-- Map area: square topo preview -->
            <div class="card-map" style="aspect-ratio: 1/1; max-height: 350px; background: #2d3b1e; position: relative; overflow: hidden; flex-shrink: 0;">
              <div class="topo-bg absolute inset-0" />
              <svg v-if="cardPaths[entry.id]" viewBox="0 0 200 200" class="absolute inset-0 w-full h-full">
                <path :d="cardPaths[entry.id].d" class="route-line" />
                <circle :cx="cardPaths[entry.id].start[0]" :cy="cardPaths[entry.id].start[1]" r="5" class="dot-start" />
                <circle :cx="cardPaths[entry.id].end[0]"   :cy="cardPaths[entry.id].end[1]"   r="5" class="dot-end" />
              </svg>
              <div v-else class="absolute inset-0 flex items-center justify-center">
                <div class="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin opacity-40" />
              </div>
              <!-- Action buttons (hover) -->
              <div class="card-actions absolute top-2 right-2 flex gap-1.5 opacity-0 transition-opacity duration-150">
                <button
                  class="card-action-btn"
                  @click.stop="downloadGpx(entry)"
                  title="下載 GPX"
                >↓</button>
                <button class="card-action-btn" @click.stop="openEdit(entry)" title="編輯">編輯</button>
                <button class="card-action-btn card-action-del" @click.stop="confirmDelete(entry)" title="刪除">刪除</button>
              </div>
            </div>
            <!-- Footer -->
            <div class="card-footer" style="background: #1a1510; border-top: 1px solid rgba(255,255,255,0.08); padding: 10px 12px 11px;">
              <p class="card-name font-heading font-bold text-ink mb-1.5" style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ entry.name }}</p>
              <div class="flex flex-wrap gap-1 mb-1.5">
                <span v-if="entry.category" class="tag-cat">{{ entry.category }}</span>
                <span v-if="entry.peopleCount" class="tag-ppl">👤 {{ entry.peopleCount }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-primary" style="font-size: 12px;">{{ starsDisplay(entry.difficultyStars) }}</span>
                <span class="font-mono text-inkMuted" style="font-size: 10px;">{{ entry.date ?? '—' }}</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- Editor side panel (460px, shown when panelOpen) -->
        <Transition name="gear-panel">
          <div v-if="panelOpen" class="w-[460px] shrink-0 card-aged p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-heading text-base text-ink">{{ editingId ? '編輯路線' : '新增 GPX' }}</h2>
              <button class="text-inkMuted hover:text-ink cursor-pointer transition-colors" @click="closePanel"><XIcon :size="16" /></button>
            </div>

            <!-- 路線名稱 -->
            <div class="mb-3">
              <label class="field-label">路線名稱 *</label>
              <input v-model="form.name" type="text" class="input-field text-sm" placeholder="路線名稱" />
            </div>

            <!-- 日期 / 人數 / 星等 -->
            <div class="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label class="field-label">日期</label>
                <input v-model="form.date" type="date" class="input-field text-sm font-mono" />
              </div>
              <div>
                <label class="field-label">人數</label>
                <input v-model.number="form.peopleCount" type="number" min="1" class="input-field text-sm font-mono no-spinner" placeholder="1" />
              </div>
              <div>
                <label class="field-label">難度星等 (1–5)</label>
                <input v-model.number="form.difficultyStars" type="number" min="1" max="5" class="input-field text-sm font-mono no-spinner" placeholder="1–5" />
              </div>
            </div>

            <!-- 山岳分類 -->
            <div class="mb-3">
              <label class="field-label">山岳分類</label>
              <select v-model="form.category" class="input-field text-sm font-body">
                <option value="">— 選擇分類 —</option>
                <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <!-- 參考連結 -->
            <div class="mb-3">
              <label class="field-label">參考連結</label>
              <input v-model="form.referenceUrl" type="url" class="input-field text-sm font-mono" placeholder="https://..." />
            </div>

            <!-- GPX 檔案 -->
            <div class="mb-4">
              <label class="field-label">GPX 檔案{{ editingId ? '（選填，重新上傳才更新）' : ' *' }}</label>
              <div
                class="relative flex flex-col items-center justify-center gap-1 rounded-lg cursor-pointer transition-colors duration-150"
                style="height: 56px; border: 1px dashed rgba(198,172,143,0.3); background: rgba(198,172,143,0.04);"
                @click="fileInputEl?.click()"
              >
                <UploadIcon :size="15" class="text-inkMuted opacity-60" />
                <span class="text-[11px] font-body text-inkMuted">
                  {{ form.gpxFile ? form.gpxFile.name : '選擇 .gpx 檔案' }}
                </span>
                <input ref="fileInputEl" type="file" accept=".gpx" class="hidden" @change="onFileChange" />
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
                @click="closePanel"
              >取消</button>
              <button
                class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!form.name.trim() || (!editingId && !form.gpxFile) || saving"
                @click="submitForm"
              >
                <span v-if="saving" class="w-3 h-3 border-2 rounded-full animate-spin border-current border-t-transparent" />
                <SaveIcon v-else :size="13" />
                {{ saving ? '儲存中…' : (editingId ? '儲存更新' : '確認新增') }}
              </button>
            </div>
          </div>
        </Transition>

      </div>
    </div>
  </div>

  <!-- ── Detail Modal (Leaflet map) ──────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="detailEntry" class="modal-backdrop" @click.self="closeDetail">
        <div class="detail-modal">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div>
              <p class="text-[10px] font-body uppercase tracking-widest text-primary opacity-60 mb-0.5">Route Preview</p>
              <h2 class="font-heading text-lg text-ink">{{ detailEntry.name }}</h2>
            </div>
            <button class="text-inkMuted hover:text-ink transition-colors cursor-pointer" @click="closeDetail"><XIcon :size="18" /></button>
          </div>
          <!-- Leaflet map -->
          <div ref="detailMapEl" style="height: 420px;" />
          <!-- Stats -->
          <div v-if="detailStats" class="flex items-center justify-around px-5 py-4 border-t border-border/40">
            <div class="text-center">
              <p class="font-heading text-xl font-bold text-ink leading-none mb-0.5">{{ detailStats.distanceKm }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">km 路線長</p>
            </div>
            <div class="w-px h-8 bg-border/40" />
            <div class="text-center">
              <p class="font-heading text-xl font-bold text-ink leading-none mb-0.5">{{ detailStats.totalAscent }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">m 爬升</p>
            </div>
            <div class="w-px h-8 bg-border/40" />
            <div class="text-center">
              <p class="font-heading text-xl font-bold text-ink leading-none mb-0.5">{{ detailStats.maxElevation }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">m 最高點</p>
            </div>
            <div class="w-px h-8 bg-border/40" />
            <div class="text-center">
              <p class="font-heading text-xl font-bold text-ink leading-none mb-0.5">{{ detailStats.minElevation }}</p>
              <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">m 最低點</p>
            </div>
          </div>
          <div v-else class="py-4 text-center text-inkMuted font-body text-sm">載入路線資料中…</div>
          <div v-if="detailEntry.referenceUrl" class="px-5 py-3 border-t border-border/40 flex items-center gap-2">
            <span class="text-[10px] font-body uppercase tracking-widest text-inkMuted shrink-0">參考連結</span>
            <a :href="detailEntry.referenceUrl" target="_blank" rel="noopener noreferrer"
               class="text-xs font-mono text-primary hover:opacity-70 truncate transition-opacity">
              {{ detailEntry.referenceUrl }}
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Confirm Modal ───────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="deletingEntry" class="modal-backdrop" @click.self="deletingEntry = null">
        <div class="delete-modal">
          <div class="modal-icon-wrap"><Trash2Icon :size="24" /></div>
          <h2 class="font-heading text-xl font-bold text-ink mb-1">刪除這條路線？</h2>
          <p class="font-body text-sm text-inkMuted leading-relaxed mb-2">「{{ deletingEntry.name }}」及其 GPX 檔案將被永久刪除。</p>
          <p v-if="apiError" class="text-red-400 text-xs font-body mb-3 flex items-center gap-1">
            <AlertCircleIcon :size="12" /> {{ apiError }}
          </p>
          <div class="flex gap-3 mt-5">
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
              :disabled="saving" @click="deletingEntry = null"
            >取消</button>
            <button
              class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer delete-confirm-btn flex items-center justify-center gap-1.5"
              :disabled="saving" @click="executeDelete"
            >
              <span v-if="saving" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
              <Trash2Icon v-else :size="13" />
              {{ saving ? '刪除中…' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ArrowLeft as ArrowLeftIcon, Plus as PlusIcon, Search as SearchIcon,
  X as XIcon, Save as SaveIcon, Trash2 as Trash2Icon,
  AlertCircle as AlertCircleIcon, Map as MapIcon, Upload as UploadIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
} from 'lucide-vue-next'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import type { GpxLibraryEntry } from '../types'
import {
  parseGPXFromUrl, downsampleCoords, gpxCoordsToSvgPath,
  computeElevationStats, computeTotalDistanceKm,
} from '../services/gpx'

const CATEGORIES = ['郊山', '中級山', '高山', '百岳', '技術路線'] as const

const store = useGpxLibraryStore()
onMounted(async () => {
  await store.fetchGpxLibrary()
  loadAllCardGpx()
})

// ── Search & filters ─────────────────────────────────────
const search         = ref('')
const filterCategory = ref<string[]>([])
const filterStars    = ref<number[]>([])

const showFilterPanel   = ref(false)
const activeFilterCount = computed(() => filterCategory.value.length + filterStars.value.length)
const hasActiveFilter   = computed(() => !!search.value.trim() || activeFilterCount.value > 0)

function toggleCategory(cat: string) {
  const i = filterCategory.value.indexOf(cat)
  filterCategory.value = i === -1
    ? [...filterCategory.value, cat]
    : filterCategory.value.filter(c => c !== cat)
}

function toggleStars(n: number) {
  const i = filterStars.value.indexOf(n)
  filterStars.value = i === -1
    ? [...filterStars.value, n]
    : filterStars.value.filter(s => s !== n)
}

function clearFilters() {
  search.value         = ''
  filterCategory.value = []
  filterStars.value    = []
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.gpxLibrary.filter(e => {
    if (q && !e.name.toLowerCase().includes(q)) return false
    if (filterCategory.value.length && !filterCategory.value.includes(e.category ?? '')) return false
    if (filterStars.value.length && !filterStars.value.includes(e.difficultyStars ?? 0)) return false
    return true
  })
})

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const e of store.gpxLibrary) {
    if (e.category) counts[e.category] = (counts[e.category] ?? 0) + 1
  }
  return counts
})

function starsDisplay(stars?: number | null): string {
  if (!stars) return '—'
  return '★'.repeat(stars) + '☆'.repeat(5 - stars)
}

// ── Card GPX SVG loading ──────────────────────────────────
type CardPath = { d: string; start: [number, number]; end: [number, number] }
const cardPaths = reactive<Record<string, CardPath>>({})

function loadAllCardGpx() {
  for (const entry of store.gpxLibrary) {
    if (!cardPaths[entry.id]) loadCardGpx(entry)
  }
}

async function loadCardGpx(entry: GpxLibraryEntry) {
  try {
    const gpxData = await parseGPXFromUrl(entry.gpxFileUrl)
    const sampled = downsampleCoords(gpxData.coordinates, 200)
    const result  = gpxCoordsToSvgPath(sampled)
    cardPaths[entry.id] = result
  } catch { /* silently skip on error */ }
}

watch(() => store.gpxLibrary, (entries) => {
  for (const e of entries) {
    if (!cardPaths[e.id]) loadCardGpx(e)
  }
}, { deep: false })

// ── Editor panel ──────────────────────────────────────────
type GpxForm = {
  name: string; date: string; peopleCount: number | null
  difficultyStars: number | null; category: string; referenceUrl: string; gpxFile: File | null
}

const panelOpen  = ref(false)
const editingId  = ref<string | null>(null)
const saving     = ref(false)
const apiError   = ref<string | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)

const blankForm = (): GpxForm => ({
  name: '', date: '', peopleCount: null, difficultyStars: null, category: '', referenceUrl: '', gpxFile: null,
})
const form = ref<GpxForm>(blankForm())

function openCreate() {
  editingId.value = null
  form.value      = blankForm()
  apiError.value  = null
  panelOpen.value = true
}

function openEdit(entry: GpxLibraryEntry) {
  editingId.value = entry.id
  form.value = {
    name:            entry.name,
    date:            entry.date ?? '',
    peopleCount:     entry.peopleCount ?? null,
    difficultyStars: entry.difficultyStars ?? null,
    category:        entry.category ?? '',
    referenceUrl:    entry.referenceUrl ?? '',
    gpxFile:         null,
  }
  apiError.value  = null
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
  editingId.value = null
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  form.value.gpxFile = input.files?.[0] ?? null
}

async function submitForm() {
  if (!form.value.name.trim()) return
  if (!editingId.value && !form.value.gpxFile) return
  saving.value   = true
  apiError.value = null
  try {
    const payload = {
      name:            form.value.name.trim(),
      date:            form.value.date || null,
      difficultyStars: form.value.difficultyStars ?? null,
      category:        form.value.category || null,
      peopleCount:     form.value.peopleCount ?? null,
      referenceUrl:    form.value.referenceUrl.trim() || null,
    }
    if (editingId.value) {
      await store.updateGpxRoute(editingId.value, { ...payload, gpxFile: form.value.gpxFile })
      if (form.value.gpxFile) {
        delete cardPaths[editingId.value]
        const updated = store.gpxLibrary.find(e => e.id === editingId.value)
        if (updated) loadCardGpx(updated)
      }
    } else {
      await store.createGpxRoute({ ...payload, gpxFile: form.value.gpxFile! })
      const newest = store.gpxLibrary[0]
      if (newest) loadCardGpx(newest)
    }
    panelOpen.value = false
  } catch (e) {
    apiError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

// ── Detail modal (Leaflet) ───────────────────────────────
const detailEntry  = ref<GpxLibraryEntry | null>(null)
const detailMapEl  = ref<HTMLDivElement | null>(null)
const detailStats  = ref<{ distanceKm: number; totalAscent: number; maxElevation: number; minElevation: number } | null>(null)
let   leafletMap: L.Map | null = null

onUnmounted(() => {
  if (leafletMap) { leafletMap.remove(); leafletMap = null }
})

async function openDetail(entry: GpxLibraryEntry) {
  detailEntry.value = entry
  detailStats.value = null
  await nextTick()
  await initDetailMap(entry)
}

function closeDetail() {
  detailEntry.value = null
  if (leafletMap) { leafletMap.remove(); leafletMap = null }
}

async function initDetailMap(entry: GpxLibraryEntry) {
  if (!detailMapEl.value) return
  if (leafletMap) { leafletMap.remove(); leafletMap = null }

  leafletMap = L.map(detailMapEl.value)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(leafletMap)

  try {
    const gpxData = await parseGPXFromUrl(entry.gpxFileUrl)
    const latlngs = gpxData.coordinates.map(([lat, lng]) => [lat, lng] as [number, number])

    const polyline = L.polyline(latlngs, { color: '#f4a261', weight: 3 }).addTo(leafletMap)
    leafletMap.fitBounds(polyline.getBounds(), { padding: [24, 24] })

    if (latlngs.length > 0) {
      L.circleMarker(latlngs[0],                   { radius: 6, fillColor: '#7fcf7f', fillOpacity: 1, color: '#fff', weight: 1.5 }).addTo(leafletMap)
      L.circleMarker(latlngs[latlngs.length - 1],  { radius: 6, fillColor: '#e07070', fillOpacity: 1, color: '#fff', weight: 1.5 }).addTo(leafletMap)
    }

    const elevStats = computeElevationStats(gpxData.elevation)
    detailStats.value = {
      distanceKm:   computeTotalDistanceKm(gpxData.coordinates),
      totalAscent:  elevStats.totalAscent,
      maxElevation: elevStats.maxElevation,
      minElevation: elevStats.minElevation,
    }
  } catch {
    detailStats.value = null
  }
}

// ── Download ─────────────────────────────────────────────
async function downloadGpx(entry: GpxLibraryEntry) {
  const res  = await fetch(entry.gpxFileUrl)
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${entry.name}${entry.date ? '_' + entry.date : ''}.gpx`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Delete confirm ───────────────────────────────────────
const deletingEntry = ref<GpxLibraryEntry | null>(null)

function confirmDelete(entry: GpxLibraryEntry) {
  deletingEntry.value = entry
  apiError.value      = null
}

async function executeDelete() {
  if (!deletingEntry.value) return
  saving.value   = true
  apiError.value = null
  try {
    await store.deleteGpxRoute(deletingEntry.value.id)
    delete cardPaths[deletingEntry.value.id]
    deletingEntry.value = null
  } catch (e) {
    apiError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Card ─────────────────────────────────────────────── */
.gpx-card {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  background: #1a1510;
  display: flex;
  flex-direction: column;
  transition: transform 0.15s, box-shadow 0.15s;
}
.gpx-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
.gpx-card:hover .card-actions { opacity: 1 !important; }

.topo-bg {
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(140,120,80,0.14) 10px, rgba(140,120,80,0.14) 11px),
    repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(140,120,80,0.07) 10px, rgba(140,120,80,0.07) 11px);
}

.route-line {
  fill: none; stroke: #f4a261; stroke-width: 3;
  stroke-linecap: round; stroke-linejoin: round;
  filter: drop-shadow(0 0 6px rgba(244,162,97,0.5));
}
.dot-start { fill: #7fcf7f; filter: drop-shadow(0 0 3px rgba(127,207,127,0.6)); }
.dot-end   { fill: #e07070; filter: drop-shadow(0 0 3px rgba(220,112,112,0.6)); }

.card-actions { opacity: 0; }
.card-action-btn {
  font-size: 9px; font-family: monospace; padding: 3px 8px; border-radius: 4px;
  cursor: pointer; backdrop-filter: blur(4px);
  background: rgba(30,25,20,0.8); color: var(--c-inkMuted);
  border: 1px solid rgba(255,255,255,0.12);
  transition: color 0.12s, border-color 0.12s;
  text-decoration: none; display: inline-block;
}
.card-action-btn:hover { color: var(--c-ink); border-color: rgba(255,255,255,0.25); }
.card-action-del { color: #774444; border-color: rgba(220,80,80,0.2); }
.card-action-del:hover { color: #e07070; border-color: rgba(220,80,80,0.4); }

.tag-cat {
  font-size: 10px; font-family: monospace; padding: 2px 7px; border-radius: 4px;
  background: rgba(244,162,97,0.15); color: #f4a261; border: 1px solid rgba(244,162,97,0.28);
}
.tag-ppl {
  font-size: 10px; font-family: monospace; padding: 2px 7px; border-radius: 4px;
  background: rgba(198,172,143,0.12); color: var(--c-primary); border: 1px solid rgba(198,172,143,0.2);
}

/* ── Form ─────────────────────────────────────────────── */
.field-label {
  display: block; font-size: 11px; font-family: Inter, sans-serif;
  font-weight: 600; color: var(--c-inkMuted);
  letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 5px;
}
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }

/* ── Panel transition ─────────────────────────────────── */
.gear-panel-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.gear-panel-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.gear-panel-enter-from, .gear-panel-leave-to { opacity: 0; transform: translateX(20px); }

.filter-panel-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.filter-panel-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.filter-panel-enter-from, .filter-panel-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }

/* ── Detail modal ─────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 9000;
  display: flex; align-items: center; justify-content: center; padding: 24px;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
}
.detail-modal {
  width: 100%; max-width: 800px; max-height: 90vh;
  border-radius: 16px; overflow: hidden;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
  display: flex; flex-direction: column;
}

/* ── Delete modal ─────────────────────────────────────── */
.delete-modal {
  width: 100%; max-width: 360px; border-radius: 16px;
  padding: 32px 28px 28px; background: var(--c-card);
  border: 1px solid rgba(220,60,60,0.25);
  box-shadow: 0 24px 64px rgba(0,0,0,0.5); text-align: center;
}
.modal-icon-wrap {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.3);
  color: #e07070; display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
}
.delete-confirm-btn {
  background: rgba(220,60,60,0.15); color: #e07070;
  border: 1px solid rgba(220,60,60,0.4);
}
.delete-confirm-btn:hover:not(:disabled) {
  background: rgba(220,60,60,0.28); border-color: rgba(220,60,60,0.65);
}

/* ── Modal transitions ───────────────────────────────── */
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .detail-modal,
.modal-enter-from .delete-modal { transform: translateY(12px) scale(0.98); }
</style>
