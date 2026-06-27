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
          @click="editorPanel?.openCreate()"
        ><PlusIcon :size="15" /> 新增 GPX</button>
      </div>

      <!-- Stats + search + filter bar -->
      <GpxFilterBar v-model:viewMode="viewMode" />

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
            <button class="btn-cta inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer" @click="editorPanel?.openCreate()">
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
            <template v-for="item in groupedFiltered" :key="item.type === 'card' ? item.entry.id : item.label">

              <!-- Group divider -->
              <div
                v-if="item.type === 'divider'"
                class="col-span-full mt-5 pb-2"
                :style="item.isWishlist
                  ? 'border-bottom: 1px solid color-mix(in srgb, var(--c-primary) 35%, transparent);'
                  : 'border-bottom: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);'"
              >
                <div class="flex items-end justify-between">
                  <div class="flex items-center gap-2">
                    <BookmarkIcon v-if="item.isWishlist" :size="18" style="color: var(--c-primary);" />
                    <RouteIcon v-else :size="18" style="color: var(--c-inkMuted);" />
                    <span
                      class="font-heading font-bold uppercase tracking-widest leading-none select-none"
                      style="font-size: 22px;"
                      :style="item.isWishlist ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'"
                    >{{ item.label }}</span>
                  </div>
                  <span
                    class="font-mono font-bold leading-none select-none"
                    style="font-size: 20px;"
                    :style="item.isWishlist ? 'color: var(--c-primary);' : 'color: var(--c-inkMuted);'"
                  >{{ item.count }}</span>
                </div>
              </div>

              <!-- Card -->
              <GpxCard
                v-else
                :ref="el => observeCard((el as any)?.$el ?? null)"
                :entry="item.entry"
                :view-mode="viewMode"
                :card-elevation="cardElevations[item.entry.id]"
                :is-dragging="draggingId === item.entry.id"
                :is-drag-over="dragOverId === item.entry.id"
                :is-menu-open="menuOpenId === item.entry.id"
                :nature-svg="difficultyNature(item.entry.difficultyStars)"
                @click="detailModal?.openDetail(item.entry)"
                @dragstart="onDragStart(item.entry)"
                @dragover="onDragOver(item.entry)"
                @drop="onDrop(item.entry)"
                @dragend="onDragEnd"
                @toggle-wishlist="toggleWishlist(item.entry)"
                @open-menu="openMenu(item.entry, $event)"
              />

            </template>
          </div>
        </div>

        <!-- Editor side panel -->
        <GpxEditorPanel
          ref="editorPanel"
          :card-elevations="cardElevations"
          :load-card-gpx="loadCardGpx"
        />
      </div>
    </div>
  </div>

  <!-- Card action dropdown -->
  <GpxCardMenu
    :entry="menuOpenId ? store.gpxLibrary.find(e => e.id === menuOpenId) ?? null : null"
    :position="menuPos"
    @download="downloadGpx(store.gpxLibrary.find(e => e.id === menuOpenId)!)"
    @edit="editorPanel?.openEdit(store.gpxLibrary.find(e => e.id === menuOpenId)!)"
    @delete="confirmDelete(store.gpxLibrary.find(e => e.id === menuOpenId)!)"
    @close="closeMenu"
  />

  <!-- Detail modal -->
  <GpxDetailModal ref="detailModal" />

  <!-- Delete confirm modal -->
  <GpxDeleteModal
    :deleting-entry="deletingEntry"
    :saving="saving"
    :api-error="deleteError"
    @confirm="executeDelete"
    @cancel="deletingEntry = null"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  ArrowLeft as ArrowLeftIcon, Plus as PlusIcon, Search as SearchIcon,
  AlertCircle as AlertCircleIcon, Map as MapIcon,
  Bookmark as BookmarkIcon, Route as RouteIcon,
} from 'lucide-vue-next'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import { usePostStore } from '../stores/postStore'
import type { GpxLibraryEntry } from '../types'
import { useGpxFilter } from '../composables/useGpxFilter'
import { useGpxDrag } from '../composables/useGpxDrag'
import { useGpxCardElevation } from '../composables/useGpxCardElevation'
import { difficultyNature } from '../utils/gpxNature'
import GpxFilterBar from '../components/GpxFilterBar.vue'
import GpxCard from '../components/GpxCard.vue'
import GpxCardMenu from '../components/GpxCardMenu.vue'
import GpxDetailModal from '../components/GpxDetailModal.vue'
import GpxEditorPanel from '../components/GpxEditorPanel.vue'
import GpxDeleteModal from '../components/GpxDeleteModal.vue'

const store     = useGpxLibraryStore()
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

const { filtered, groupedFiltered, hasActiveFilter, clearFilters } = useGpxFilter()
const { cardElevations, loadCardGpx, loadAllCardGpx } = useGpxCardElevation()

const apiError = ref<string | null>(null)
const { draggingId, dragOverId, onDragStart, onDragOver, onDrop, onDragEnd } = useGpxDrag(filtered, (msg) => { apiError.value = msg })

// ── Menu ─────────────────────────────────────────────────
const menuOpenId = ref<string | null>(null)
const menuPos    = ref({ top: 0, right: 0 })

function openMenu(entry: GpxLibraryEntry, event: MouseEvent) {
  event.stopPropagation()
  if (menuOpenId.value === entry.id) { menuOpenId.value = null; return }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 4, right: window.innerWidth - rect.right }
  menuOpenId.value = entry.id
}

function closeMenu() { menuOpenId.value = null }

// ── Wishlist ──────────────────────────────────────────────
async function toggleWishlist(entry: GpxLibraryEntry) {
  try {
    await store.toggleWishlist(entry.id)
  } catch (e) {
    apiError.value = (e as Error).message
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
const deleteError   = ref<string | null>(null)
const saving        = ref(false)

function confirmDelete(entry: GpxLibraryEntry) {
  deletingEntry.value = entry
  deleteError.value   = null
}

async function executeDelete() {
  if (!deletingEntry.value) return
  saving.value      = true
  deleteError.value = null
  try {
    await store.deleteGpxRoute(deletingEntry.value.id)
    delete cardElevations[deletingEntry.value.id]
    deletingEntry.value = null
  } catch (e) {
    deleteError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

// ── Lazy reveal (IntersectionObserver) ───────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('card-visible')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: 0.08 })

function observeCard(el: Element | null) {
  if (el) revealObserver.observe(el)
}

// ── Template refs ─────────────────────────────────────────
const editorPanel = ref<InstanceType<typeof GpxEditorPanel> | null>(null)
const detailModal = ref<InstanceType<typeof GpxDetailModal> | null>(null)
</script>
