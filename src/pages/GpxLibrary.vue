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
              v-if="hasActiveFilter"
              class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
              style="background: var(--c-primary); color: var(--c-base);"
            >{{ filtered.length }}</span>
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
              <!-- Difficulty -->
              <div class="flex items-center justify-between mb-2.5">
                <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted">難度</p>
                <button
                  class="text-inkMuted hover:text-primary transition-colors cursor-pointer"
                  :title="filterStars.length === profile.difficultyMax ? '取消全部' : '選取全部'"
                  @click="filterStars = filterStars.length === profile.difficultyMax
                    ? []
                    : Array.from({ length: profile.difficultyMax }, (_, i) => i + 1)"
                >
                  <CheckSquareIcon v-if="filterStars.length === profile.difficultyMax" :size="14" />
                  <SquareIcon v-else :size="14" />
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5 mb-4">
                <button
                  v-for="n in profile.difficultyMax" :key="n"
                  class="px-2.5 py-1 rounded-full text-xs font-mono transition-colors duration-150 cursor-pointer border"
                  :style="filterStars.includes(n)
                    ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                    : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
                  :title="profile.difficultyLabels[n - 1] || undefined"
                  @click="toggleStars(n)"
                >{{ n <= 10 ? '★'.repeat(n) : `★×${n}` }}</button>
              </div>

              <!-- Tags -->
              <template v-if="postStore.availableTags.length">
                <div class="flex items-center justify-between mb-2.5">
                  <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted">標籤</p>
                  <button
                    class="text-inkMuted hover:text-primary transition-colors cursor-pointer"
                    :title="filterTags.length === postStore.availableTags.length ? '取消全部' : '選取全部'"
                    @click="filterTags = filterTags.length === postStore.availableTags.length ? [] : [...postStore.availableTags]"
                  >
                    <CheckSquareIcon v-if="filterTags.length === postStore.availableTags.length" :size="14" />
                    <SquareIcon v-else :size="14" />
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5 mb-4">
                  <button
                    v-for="tag in postStore.availableTags" :key="tag"
                    class="px-2.5 py-1 rounded-full text-xs font-body transition-colors duration-150 cursor-pointer border"
                    :style="filterTags.includes(tag)
                      ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                      : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
                    @click="toggleTag(tag)"
                  >{{ tag }}</button>
                </div>
              </template>

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

        <!-- View mode toggle -->
        <div class="flex items-center rounded-lg overflow-hidden" style="border: 1px solid var(--c-border);">
          <button
            class="flex items-center gap-1.5 px-3 py-2 text-xs font-body cursor-pointer transition-colors duration-150"
            :style="viewMode === 'simple'
              ? 'background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);'
              : 'background: transparent; color: var(--c-inkMuted);'"
            @click="viewMode = 'simple'"
          >
            <LayoutListIcon :size="13" />
            簡單
          </button>
          <div style="width: 1px; background: var(--c-border); align-self: stretch;" />
          <button
            class="flex items-center gap-1.5 px-3 py-2 text-xs font-body cursor-pointer transition-colors duration-150"
            :style="viewMode === 'advanced'
              ? 'background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);'
              : 'background: transparent; color: var(--c-inkMuted);'"
            @click="viewMode = 'advanced'"
          >
            <BarChart2Icon :size="13" />
            進階
          </button>
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
            <!-- Elevation chart preview (advanced mode only) -->
            <div v-if="viewMode === 'advanced'" class="card-map" style="height: 110px; background: #0e0c09; position: relative; overflow: hidden; flex-shrink: 0;">
              <!-- Loading -->
              <div v-if="!(entry.id in cardElevations)" class="absolute inset-0 flex items-center justify-center">
                <div class="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin opacity-40" />
              </div>
              <!-- No elevation data (parse failed) -->
              <div v-else-if="!cardElevations[entry.id]?.length" class="absolute inset-0 flex items-center justify-center">
                <span class="text-[10px] font-mono text-inkMuted opacity-30">no elevation</span>
              </div>
              <!-- Chart -->
              <ElevationChart
                v-else
                :elevation="cardElevations[entry.id]!"
                :mini="true"
                class="absolute inset-0 w-full h-full"
              />
            </div>
            <!-- Footer -->
            <div class="card-footer" style="background: #1a1510; border-top: 1px solid rgba(255,255,255,0.08); padding: 10px 12px 11px; position: relative;">
              <p class="card-name font-heading font-bold text-ink mb-1.5" style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ entry.name }}</p>
              <div class="flex flex-wrap gap-1 mb-1.5">
                <span v-if="entry.peopleCount" class="tag-ppl">👤 {{ entry.peopleCount }}</span>
                <span v-for="tag in entry.tags" :key="tag" class="tag-label">{{ tag }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-primary" style="font-size: 12px;">{{ starsDisplay(entry.difficultyStars) }}</span>
                <span class="font-mono text-inkMuted" style="font-size: 10px;">{{ entry.date ?? '—' }}</span>
              </div>
              <!-- Action buttons (hover) -->
              <div class="card-actions absolute top-2 right-2 flex gap-1.5 opacity-0 transition-opacity duration-150">
                <button class="card-action-btn" @click.stop="downloadGpx(entry)" title="下載 GPX">↓</button>
                <button class="card-action-btn" @click.stop="openEdit(entry)" title="編輯">編輯</button>
                <button class="card-action-btn card-action-del" @click.stop="confirmDelete(entry)" title="刪除">刪除</button>
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
                <label class="field-label">難度星等 (1–{{ profile.difficultyMax }})</label>
                <input v-model.number="form.difficultyStars" type="number" min="1" :max="profile.difficultyMax" class="input-field text-sm font-mono no-spinner" :placeholder="`1–${profile.difficultyMax}`" />
              </div>
            </div>

            <!-- 參考連結 -->
            <div class="mb-3">
              <label class="field-label">參考連結</label>
              <input v-model="form.referenceUrl" type="url" class="input-field text-sm font-mono" placeholder="https://..." />
            </div>

            <!-- 標籤 -->
            <div class="mb-3">
              <label class="field-label">標籤</label>
              <div class="flex flex-wrap gap-1.5 mb-1.5">
                <span
                  v-for="tag in form.tags" :key="tag"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body border"
                  style="background: color-mix(in srgb, var(--c-primary) 28%, transparent); border-color: var(--c-primary); color: var(--c-ink); font-weight: 600;"
                >
                  <button type="button" class="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" @click="form.tags.splice(form.tags.indexOf(tag), 1)">
                    <XIcon :size="10" />
                  </button>
                  {{ tag }}
                </span>
                <button
                  type="button"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-body cursor-pointer transition-all duration-150 border border-dashed"
                  style="color: var(--c-inkMuted); border-color: color-mix(in srgb, var(--c-border) 80%, transparent);"
                  @click="tagModalOpen = true"
                >
                  <TagIcon :size="11" /> 選擇標籤
                </button>
              </div>
              <TagPickerModal :open="tagModalOpen" v-model="form.tags" @close="tagModalOpen = false" />
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
  Square as SquareIcon, CheckSquare as CheckSquareIcon,
  LayoutList as LayoutListIcon, BarChart2 as BarChart2Icon,
  Tag as TagIcon,
} from 'lucide-vue-next'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import { useProfileStore } from '../stores/profileStore'
import { usePostStore } from '../stores/postStore'
import type { GpxLibraryEntry } from '../types'
import TagPickerModal from '../components/TagPickerModal.vue'
import {
  parseGPXFromUrl,
  computeElevationStats, computeTotalDistanceKm,
} from '../services/gpx'
import ElevationChart from '../components/ElevationChart.vue'

const store     = useGpxLibraryStore()
const profile   = useProfileStore()
const postStore = usePostStore()

const VIEW_MODE_KEY = 'gpx-library-view-mode'
const viewMode = ref<'simple' | 'advanced'>(
  (localStorage.getItem(VIEW_MODE_KEY) as 'simple' | 'advanced' | null) ?? 'simple'
)
watch(viewMode, (mode) => {
  localStorage.setItem(VIEW_MODE_KEY, mode)
  if (mode === 'advanced') loadAllCardGpx()
})

onMounted(async () => {
  await store.fetchGpxLibrary()
  postStore.fetchTags()
  if (viewMode.value === 'advanced') loadAllCardGpx()
})

// ── Search & filters ─────────────────────────────────────
const search         = ref('')
const filterStars    = ref<number[]>([])
const filterTags     = ref<string[]>([])

const showFilterPanel   = ref(false)
const activeFilterCount = computed(() => filterStars.value.length + filterTags.value.length)

watch(() => profile.difficultyMax, (max) => {
  filterStars.value = filterStars.value.filter(n => n <= max)
})
const hasActiveFilter   = computed(() => !!search.value.trim() || activeFilterCount.value > 0)

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
  search.value     = ''
  filterStars.value = []
  filterTags.value  = []
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.gpxLibrary.filter(e => {
    if (q && !e.name.toLowerCase().includes(q)) return false
    if (filterStars.value.length && !filterStars.value.includes(e.difficultyStars ?? 0)) return false
    if (filterTags.value.length && !filterTags.value.some(t => e.tags?.includes(t))) return false
    return true
  })
})

function starsDisplay(stars?: number | null): string {
  if (!stars) return '—'
  return '★'.repeat(stars)
}

// ── Card elevation data loading ───────────────────────────
const cardElevations = reactive<Record<string, number[] | null>>({})

function loadAllCardGpx() {
  for (const entry of store.gpxLibrary) {
    if (!(entry.id in cardElevations)) loadCardGpx(entry)
  }
}

async function loadCardGpx(entry: GpxLibraryEntry) {
  try {
    const gpxData = await parseGPXFromUrl(entry.gpxFileUrl)
    cardElevations[entry.id] = gpxData.elevation
  } catch {
    cardElevations[entry.id] = null
  }
}

watch(() => store.gpxLibrary, (entries) => {
  if (viewMode.value !== 'advanced') return
  for (const e of entries) {
    if (!(e.id in cardElevations)) loadCardGpx(e)
  }
}, { deep: false })

// ── Editor panel ──────────────────────────────────────────
type GpxForm = {
  name: string; date: string; peopleCount: number | null
  difficultyStars: number | null; referenceUrl: string
  tags: string[]; gpxFile: File | null
}

const panelOpen   = ref(false)
const editingId   = ref<string | null>(null)
const saving      = ref(false)
const apiError    = ref<string | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)
const tagModalOpen = ref(false)

const blankForm = (): GpxForm => ({
  name: '', date: '', peopleCount: null, difficultyStars: null, referenceUrl: '', tags: [], gpxFile: null,
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
    referenceUrl:    entry.referenceUrl ?? '',
    tags:            entry.tags ? [...entry.tags] : [],
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
      peopleCount:     form.value.peopleCount ?? null,
      referenceUrl:    form.value.referenceUrl.trim() || null,
      tags:            form.value.tags,
    }
    if (editingId.value) {
      await store.updateGpxRoute(editingId.value, { ...payload, gpxFile: form.value.gpxFile })
      if (form.value.gpxFile) {
        delete cardElevations[editingId.value]
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
    delete cardElevations[deletingEntry.value.id]
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

.tag-ppl {
  font-size: 10px; font-family: monospace; padding: 2px 7px; border-radius: 4px;
  background: rgba(198,172,143,0.12); color: var(--c-primary); border: 1px solid rgba(198,172,143,0.2);
}
.tag-label {
  font-size: 10px; font-family: Inter, sans-serif; padding: 2px 7px; border-radius: 4px;
  background: color-mix(in srgb, var(--c-primary) 18%, transparent);
  color: var(--c-ink); border: 1px solid color-mix(in srgb, var(--c-primary) 30%, transparent);
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
