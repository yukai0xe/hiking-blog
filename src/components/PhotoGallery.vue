<template>
  <div>
    <template v-if="!headless">
      <div v-if="photos.length === 0" class="text-center text-inkMuted py-16 font-body italic">
        — 尚無照片 —
      </div>
      <div v-else>
        <div class="columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-3">
          <div
            v-for="(photo, i) in displayPhotos"
            :key="photo.id"
            class="relative break-inside-avoid cursor-pointer overflow-hidden group"
            @click="openPhoto(i)"
          >
            <img
              :src="photo.url"
              alt=""
              loading="lazy"
              class="w-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-[1.02]"
            />
            <!-- Star / favourite -->
            <button
              class="absolute top-2 right-2 w-7 h-7 rounded-full backdrop-blur-sm border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer z-10"
              :class="favoriteIds.has(photo.id)
                ? 'opacity-100 bg-base/70 border-border/60'
                : 'bg-base/70 border-border/60 text-inkMuted hover:bg-base'"
              :style="favoriteIds.has(photo.id) ? 'color: #F2BB05;' : ''"
              @click.stop="toggleFavorite(photo.id)"
              aria-label="加入最愛"
            >
              <StarIcon :size="13" :fill="favoriteIds.has(photo.id) ? '#F2BB05' : 'none'" :color="favoriteIds.has(photo.id) ? '#F2BB05' : 'currentColor'" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="lb">
        <div
          v-if="activeIndex !== null"
          class="lb-backdrop"
          @click.self="close"
        >
          <!-- Top bar -->
          <div class="lb-topbar">
            <span class="lb-counter font-mono">
              {{ activeIndex + 1 }} / {{ displayPhotos.length }}
            </span>

            <div class="lb-topbar-right">
              <!-- Image info -->
              <div v-if="imgInfo" class="lb-info font-mono">
                <span>{{ imgInfo.width }} × {{ imgInfo.height }}</span>
                <span class="lb-info-sep">·</span>
                <span>{{ imgInfo.mp }} MP</span>
              </div>
              <div v-else-if="activeIndex !== null" class="lb-info-loading">
                <span class="lb-info-dot" />
              </div>

              <!-- Download -->
              <button
                class="lb-icon-btn"
                :class="{ 'lb-icon-btn--loading': downloading }"
                @click="downloadPhoto"
                aria-label="下載圖片"
                :disabled="downloading"
              >
                <span v-if="downloading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <DownloadIcon v-else :size="17" />
              </button>

              <!-- Close -->
              <button class="lb-icon-btn" @click="close" aria-label="關閉">
                <XIcon :size="18" />
              </button>
            </div>
          </div>

          <!-- Stage -->
          <div
            class="lb-stage"
            @wheel.prevent="onWheel"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          >
            <img
              :src="displayPhotos[activeIndex].url"
              class="lb-img"
              :style="imgStyle"
              draggable="false"
              alt=""
            />
          </div>

          <!-- Prev arrow -->
          <button
            v-if="activeIndex > 0"
            class="lb-arrow lb-arrow--prev"
            @click="prevPhoto"
            aria-label="上一張"
          >
            <ChevronLeftIcon :size="24" />
          </button>

          <!-- Next arrow -->
          <button
            v-if="activeIndex < displayPhotos.length - 1"
            class="lb-arrow lb-arrow--next"
            @click="nextPhoto"
            aria-label="下一張"
          >
            <ChevronRightIcon :size="24" />
          </button>

          <!-- Zoom bar -->
          <div class="lb-zoombar">
            <button class="lb-icon-btn lb-icon-btn--sm" @click="adjustZoom(-0.4)" aria-label="縮小">
              <ZoomOutIcon :size="16" />
            </button>
            <span class="lb-zoom-pct font-mono">{{ Math.round(scale * 100) }}%</span>
            <button class="lb-icon-btn lb-icon-btn--sm" @click="adjustZoom(0.4)" aria-label="放大">
              <ZoomInIcon :size="16" />
            </button>
            <div class="lb-divider" />
            <button class="lb-icon-btn lb-icon-btn--sm" @click="resetZoom" aria-label="重設">
              <Maximize2Icon :size="15" />
            </button>
          </div>

          <!-- Tree indicators -->
          <div v-if="displayPhotos.length > 1 && displayPhotos.length <= 20" class="lb-dots">
            <button
              v-for="(_, i) in displayPhotos"
              :key="i"
              class="lb-tree"
              :class="{ 'lb-tree--active': i === activeIndex }"
              @click="goTo(i)"
              :aria-label="`第 ${i + 1} 張`"
            >
              <svg viewBox="0 0 10 14" xmlns="http://www.w3.org/2000/svg">
                <polygon points="5,0 8,4 2,4" />
                <polygon points="5,2 9,7 1,7" />
                <polygon points="5,5 10,11 0,11" />
                <rect x="4" y="11" width="2" height="3" />
              </svg>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  X as XIcon,
  Star as StarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Maximize2 as Maximize2Icon,
  Download as DownloadIcon,
} from 'lucide-vue-next'
const props = defineProps<{
  photos:    { id: string; url: string }[]
  headless?: boolean
}>()

// ── Favourite ────────────────────────────────────────────
const STORAGE_KEY = 'photo-favorites'

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

const favoriteIds = ref<Set<string>>(loadFavorites())

function resetFavorites() {
  favoriteIds.value = new Set()
  localStorage.removeItem(STORAGE_KEY)
}

function toggleFavorite(id: string) {
  const s = new Set(favoriteIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  favoriteIds.value = s
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]))
}

const displayPhotos = computed(() => {
  const fav  = props.photos.filter(p => favoriteIds.value.has(p.id))
  const rest = props.photos.filter(p => !favoriteIds.value.has(p.id))
  return [...fav, ...rest]
})

// ── Lightbox state ──────────────────────────────────────
const activeIndex = ref<number | null>(null)
const scale       = ref(1)
const offsetX     = ref(0)
const offsetY     = ref(0)
const isDragging  = ref(false)

interface ImgInfo { width: number; height: number; mp: string }
const imgInfo    = ref<ImgInfo | null>(null)
const downloading = ref(false)

watch(activeIndex, (idx) => {
  imgInfo.value = null
  if (idx === null) return
  const img = new Image()
  img.onload = () => {
    const px = img.naturalWidth * img.naturalHeight
    imgInfo.value = {
      width: img.naturalWidth,
      height: img.naturalHeight,
      mp: (px / 1_000_000).toFixed(1),
    }
  }
  img.src = displayPhotos.value[idx].url
})

const MIN_SCALE = 0.5
const MAX_SCALE = 5

let dragStartX = 0
let dragStartY = 0
let dragBaseX  = 0
let dragBaseY  = 0
let pointerDownX = 0
let pointerDownY = 0

// ── Computed image style ────────────────────────────────
const imgStyle = computed(() => ({
  transform:  `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
  cursor:     scale.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'default',
  transition: isDragging.value ? 'none' : 'transform 0.15s ease',
  userSelect: 'none' as const,
}))

// ── Open / close ────────────────────────────────────────
function openPhoto(index: number) {
  activeIndex.value = index
  resetZoom()
  document.addEventListener('keydown', onKeyDown)
}

function close() {
  activeIndex.value = null
  document.removeEventListener('keydown', onKeyDown)
}

function goTo(index: number) {
  activeIndex.value = index
  resetZoom()
}

function prevPhoto() {
  if (activeIndex.value === null || activeIndex.value <= 0) return
  activeIndex.value--
  resetZoom()
}

function nextPhoto() {
  if (activeIndex.value === null || activeIndex.value >= displayPhotos.value.length - 1) return
  activeIndex.value++
  resetZoom()
}

// ── Zoom ────────────────────────────────────────────────
function resetZoom() {
  scale.value   = 1
  offsetX.value = 0
  offsetY.value = 0
}

function adjustZoom(delta: number) {
  scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value + delta))
  if (scale.value <= 1) { offsetX.value = 0; offsetY.value = 0 }
}

function onWheel(e: WheelEvent) {
  adjustZoom(e.deltaY < 0 ? 0.2 : -0.2)
}

// ── Drag to pan ─────────────────────────────────────────
function onPointerDown(e: PointerEvent) {
  pointerDownX = e.clientX
  pointerDownY = e.clientY
  if (scale.value <= 1) return
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragBaseX  = offsetX.value
  dragBaseY  = offsetY.value
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  offsetX.value = dragBaseX + (e.clientX - dragStartX)
  offsetY.value = dragBaseY + (e.clientY - dragStartY)
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value) {
    const dx = e.clientX - pointerDownX
    const dy = e.clientY - pointerDownY
    if (Math.abs(dx) > 50 && Math.abs(dy) < 60) {
      if (dx < 0) nextPhoto()
      else prevPhoto()
    }
  }
  isDragging.value = false
}

// ── Keyboard ────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape')      close()
  if (e.key === 'ArrowLeft')   prevPhoto()
  if (e.key === 'ArrowRight')  nextPhoto()
  if (e.key === '+')           adjustZoom(0.4)
  if (e.key === '-')           adjustZoom(-0.4)
}

onUnmounted(() => document.removeEventListener('keydown', onKeyDown))

// ── Download ────────────────────────────────────────────
async function downloadPhoto() {
  if (activeIndex.value === null || downloading.value) return
  downloading.value = true
  try {
    const url  = displayPhotos.value[activeIndex.value].url
    const res  = await fetch(url)
    const blob = await res.blob()
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `photo-${activeIndex.value + 1}.${blob.type.split('/')[1] || 'jpg'}`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) {
    console.error(e)
  } finally {
    downloading.value = false
  }
}

defineExpose({ hasFavorites: computed(() => favoriteIds.value.size > 0), resetFavorites, openPhoto })
</script>

<style scoped>
/* ── Backdrop ───────────────────────────────────────────── */
.lb-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10, 9, 8, 0.96);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

/* ── Top bar ────────────────────────────────────────────── */
.lb-topbar {
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(to bottom, rgba(10,9,8,0.72), transparent);
  z-index: 2;
  gap: 12px;
}
.lb-counter {
  font-size: 12px;
  color: rgba(198,172,143,0.7);
  letter-spacing: 0.1em;
  flex-shrink: 0;
}
.lb-topbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.lb-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(198,172,143,0.6);
  letter-spacing: 0.05em;
  background: rgba(10,9,8,0.45);
  border: 1px solid rgba(198,172,143,0.12);
  border-radius: 6px;
  padding: 3px 9px;
  white-space: nowrap;
}
.lb-info-sep { opacity: 0.4; }
.lb-info-loading {
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lb-info-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: rgba(198,172,143,0.35);
  animation: info-pulse 1s ease-in-out infinite;
}
@keyframes info-pulse {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 1; }
}
.lb-icon-btn--loading { opacity: 0.5; cursor: not-allowed; }

/* ── Stage ──────────────────────────────────────────────── */
.lb-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.lb-img {
  max-width: 90vw;
  max-height: 88vh;
  object-fit: contain;
  box-shadow: 0 8px 48px rgba(0,0,0,0.6);
  will-change: transform;
}

/* ── Arrows ─────────────────────────────────────────────── */
.lb-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(198,172,143,0.08);
  border: 1px solid rgba(198,172,143,0.2);
  color: rgba(198,172,143,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.lb-arrow:hover {
  background: rgba(198,172,143,0.18);
  border-color: rgba(198,172,143,0.45);
  color: #c6ac8f;
}
.lb-arrow--prev { left: 16px; }
.lb-arrow--next { right: 16px; }

/* ── Zoom bar ───────────────────────────────────────────── */
.lb-zoombar {
  position: absolute;
  bottom: 52px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(10,9,8,0.7);
  border: 1px solid rgba(198,172,143,0.15);
  border-radius: 24px;
  padding: 5px 10px;
  backdrop-filter: blur(8px);
}
.lb-zoom-pct {
  font-size: 11px;
  color: rgba(198,172,143,0.7);
  min-width: 38px;
  text-align: center;
  letter-spacing: 0.05em;
}
.lb-divider {
  width: 1px;
  height: 14px;
  background: rgba(198,172,143,0.2);
  margin: 0 2px;
}

/* ── Icon buttons ───────────────────────────────────────── */
.lb-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(198,172,143,0.75);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.lb-icon-btn:hover { background: rgba(198,172,143,0.12); color: #c6ac8f; }
.lb-icon-btn--sm { width: 28px; height: 28px; border-radius: 6px; }

/* ── Tree indicators ────────────────────────────────────── */
.lb-dots {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 6px;
}
.lb-tree {
  width: 14px;
  height: 18px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  opacity: 0.28;
  padding: 0;
}
.lb-tree svg {
  width: 100%;
  height: 100%;
  fill: #c6ac8f;
  transition: fill 0.2s ease;
}
.lb-tree:hover {
  opacity: 0.6;
  transform: scaleY(1.1);
}
.lb-tree--active {
  opacity: 1;
  transform: scaleY(1.15);
}
.lb-tree--active svg {
  fill: #7eb86a;
  filter: drop-shadow(0 0 4px rgba(126,184,106,0.55));
}

/* ── Transition ─────────────────────────────────────────── */
.lb-enter-active { transition: opacity 0.2s ease; }
.lb-leave-active { transition: opacity 0.15s ease; }
.lb-enter-from, .lb-leave-to { opacity: 0; }
</style>
