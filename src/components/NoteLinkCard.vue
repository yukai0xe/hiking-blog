<template>
  <div class="link-wrapper" :class="{ 'link-wrapper--dragging': isDragging }">

    <!-- Reveal panel: shows behind card as it slides right -->
    <div class="reveal-panel" :class="{ 'reveal-panel--triggered': dragX >= THRESHOLD }">
      <div class="reveal-icon">
        <InfoIcon :size="20" />
      </div>
      <span class="text-[11px] font-mono leading-none">詳細</span>
    </div>

    <!-- Swipeable card -->
    <div
      class="link-card"
      draggable="true"
      :style="{
        transform: `translateX(${dragX}px)`,
        transition: isDragging ? 'none' : 'transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }"
      @click="onClick"
      @mousedown="onMouseDown"
      @dragstart="onDragStart"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend.passive="onTouchEnd"
    >
      <!-- Cover image (full-width on mobile, fixed-width on sm+) -->
      <div class="link-cover" :class="{ 'link-cover--icon': isFavicon && !imgError }">
        <img
          v-if="link.coverImageUrl && !imgError"
          :src="link.coverImageUrl"
          :alt="link.title"
          :class="isFavicon ? 'favicon-img' : 'w-full h-full object-cover'"
          @error="imgError = true"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <LinkIcon :size="28" class="text-inkMuted opacity-30" />
        </div>
      </div>

      <!-- Body: info + swipe hint always side-by-side -->
      <div class="link-body">
        <div class="link-info">
          <p class="text-sm font-body font-semibold text-ink line-clamp-2 leading-snug">{{ link.title }}</p>
          <p v-if="link.description" class="text-[11px] font-body text-inkMuted line-clamp-2 leading-snug">{{ link.description }}</p>
          <p class="text-[11px] font-mono text-inkMuted opacity-60 truncate">{{ link.url }}</p>
        </div>

        <!-- Swipe hint: animated chevrons -->
        <div class="swipe-hint" :class="{ 'swipe-hint--hidden': isDragging }">
          <ChevronsRightIcon :size="13" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Link as LinkIcon, Info as InfoIcon, ChevronsRight as ChevronsRightIcon } from 'lucide-vue-next'
import type { NoteLink } from '../types'

const props = defineProps<{ link: NoteLink }>()
const emit  = defineEmits<{ 'open-detail': [] }>()

const THRESHOLD = 55
const MAX_DRAG  = 92

const imgError   = ref(false)
const dragX      = ref(0)
const isDragging = ref(false)

const isFavicon = computed(() =>
  !!props.link.coverImageUrl && /favicon|\.ico($|\?)/i.test(props.link.coverImageUrl)
)

let startX         = 0
let startY         = 0
let horizontalBias = false
let wasDrag        = false

function snapBack() {
  isDragging.value = false
  dragX.value      = 0
  horizontalBias   = false
}

function addDocListeners() {
  document.addEventListener('mousemove', onDocMouseMove)
  document.addEventListener('mouseup',   onDocMouseUp)
}
function removeDocListeners() {
  document.removeEventListener('mousemove', onDocMouseMove)
  document.removeEventListener('mouseup',   onDocMouseUp)
}

function onMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  startX = e.clientX; startY = e.clientY
  horizontalBias = false; wasDrag = false
  addDocListeners()
}

function onDocMouseMove(e: MouseEvent) {
  const dx = e.clientX - startX
  const dy = Math.abs(e.clientY - startY)
  if (dx > 0 && dx >= dy) horizontalBias = true
  if (dx > 0 && (isDragging.value || (dx > 8 && dx > dy))) {
    isDragging.value = true
    dragX.value      = Math.min(MAX_DRAG, dx)
  }
}

function onDocMouseUp() {
  removeDocListeners()
  wasDrag = isDragging.value
  if (dragX.value >= THRESHOLD) emit('open-detail')
  snapBack()
}

function onClick() {
  if (wasDrag) { wasDrag = false; return }
  window.open(props.link.url, '_blank', 'noopener,noreferrer')
}

function onDragStart(e: DragEvent) {
  const dx = Math.abs(e.clientX - startX)
  const dy = Math.abs(e.clientY - startY)
  if (isDragging.value || horizontalBias || dx > dy + 1) {
    e.preventDefault(); return
  }
  removeDocListeners(); snapBack()
  e.dataTransfer!.setData('text/plain', props.link.id)
  e.dataTransfer!.effectAllowed = 'move'
}

let touchStartX = 0
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}
function onTouchMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - touchStartX
  const dy = Math.abs(e.touches[0].clientY - touchStartY)
  if (dx > 0 && (isDragging.value || (dx > 8 && dx > dy))) {
    e.preventDefault()
    isDragging.value = true
    dragX.value      = Math.min(MAX_DRAG, dx)
  }
}
function onTouchEnd() {
  if (dragX.value >= THRESHOLD) emit('open-detail')
  snapBack()
}

onUnmounted(removeDocListeners)
</script>

<style scoped>
/* ── wrapper ─────────────────────────────────────────────────────────────── */
.link-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  transition: box-shadow 0.15s, border-color 0.15s;
  user-select: none;
}
.link-wrapper:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  border-color: color-mix(in srgb, var(--c-primary) 30%, transparent);
}
.link-wrapper--dragging { cursor: grabbing; }

/* ── reveal panel ────────────────────────────────────────────────────────── */
.reveal-panel {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: flex-start; justify-content: center;
  padding-left: 18px; gap: 5px;
  background: color-mix(in srgb, var(--c-primary) 15%, transparent);
  color: color-mix(in srgb, var(--c-primary) 55%, var(--c-base));
  transition: background 0.14s ease, color 0.14s ease;
}
.reveal-panel--triggered {
  background: color-mix(in srgb, var(--c-primary) 35%, transparent);
  color: var(--c-primary);
}
.reveal-icon { transition: transform 0.14s ease; }
.reveal-panel--triggered .reveal-icon { transform: scale(1.18); }

/* ── card: column on mobile, row on sm+ ──────────────────────────────────── */
.link-card {
  position: relative;
  display: flex;
  flex-direction: column;   /* mobile: cover on top, body below */
  background: var(--c-card);
  width: 100%;
}

/* ── cover: full-width on mobile, fixed on sm+ ───────────────────────────── */
.link-cover {
  position: relative;
  width: 100%;
  height: 130px;
  background: color-mix(in srgb, var(--c-border) 30%, transparent);
  overflow: hidden;
  flex-shrink: 0;
}
.link-cover--icon {
  background: color-mix(in srgb, var(--c-primary) 8%, var(--c-card));
}
.favicon-img {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 56px; height: 56px;
  object-fit: contain;
  border-radius: 10px;
  image-rendering: crisp-edges;
}

/* ── body (info + swipe-hint, always a row) ──────────────────────────────── */
.link-body {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.link-info {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

/* ── swipe hint ──────────────────────────────────────────────────────────── */
.swipe-hint {
  display: flex; align-items: center;
  padding: 0 10px 0 2px;
  color: var(--c-inkMuted);
  opacity: 0.35;
  flex-shrink: 0;
  transition: opacity 0.18s;
  animation: hint-nudge 4s ease-in-out infinite;
}
.swipe-hint--hidden {
  opacity: 0;
  animation-play-state: paused;
}

/* ── mobile: no radius, no side margin ──────────────────────────────────── */
@media (max-width: 639px) {
  .link-wrapper {
    border-radius: 0;
    margin-left: 0;
    margin-right: 0;
  }
}

/* ── sm+ (≥ 640px): horizontal layout ───────────────────────────────────── */
@media (min-width: 640px) {
  .link-card { flex-direction: row; }
  .link-cover {
    width: 200px;
    height: 110px;
  }
  .link-info { padding: 10px 14px; }
}

@keyframes hint-nudge {
  0%, 62%, 100% { transform: translateX(0); }
  68%  { transform: translateX(4px); }
  73%  { transform: translateX(0); }
  79%  { transform: translateX(4px); }
  84%  { transform: translateX(0); }
}
</style>
