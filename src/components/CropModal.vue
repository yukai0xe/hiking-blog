<template>
  <Teleport to="body">
    <div class="crop-backdrop" @click.self="$emit('cancel')">
      <div class="crop-modal">

        <!-- Header -->
        <div class="crop-header">
          <span class="font-heading text-base font-semibold text-ink tracking-wide">裁剪封面</span>
          <button class="crop-icon-btn" @click="$emit('cancel')" aria-label="取消">
            <XIcon :size="17" />
          </button>
        </div>

        <!-- Viewport -->
        <div
          class="crop-viewport"
          ref="viewportRef"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @wheel.prevent="onWheel"
        >
          <img
            ref="imgRef"
            :src="src"
            class="crop-img"
            :style="imgStyle"
            draggable="false"
            alt=""
            @load="onImgLoad"
          />

          <!-- Rule-of-thirds guides -->
          <div class="crop-guide crop-guide--v" style="left:33.33%" />
          <div class="crop-guide crop-guide--v" style="left:66.66%" />
          <div class="crop-guide crop-guide--h" style="top:33.33%" />
          <div class="crop-guide crop-guide--h" style="top:66.66%" />

          <!-- Corner brackets -->
          <div class="crop-corner tl" /><div class="crop-corner tr" />
          <div class="crop-corner bl" /><div class="crop-corner br" />
        </div>

        <!-- Zoom controls -->
        <div class="crop-controls">
          <button class="crop-icon-btn crop-icon-btn--sm" @click="adjustScale(-0.05)" aria-label="縮小">
            <ZoomOutIcon :size="14" />
          </button>
          <input
            type="range"
            class="crop-slider"
            :min="minScale"
            :max="minScale * 3.5"
            :step="0.001"
            :value="scale"
            @input="onSlider"
          />
          <button class="crop-icon-btn crop-icon-btn--sm" @click="adjustScale(0.05)" aria-label="放大">
            <ZoomInIcon :size="14" />
          </button>
          <span class="crop-zoom-pct font-mono">{{ zoomPct }}%</span>
        </div>

        <!-- Footer -->
        <div class="crop-footer">
          <button
            class="crop-btn crop-btn--cancel font-body font-semibold cursor-pointer"
            @click="$emit('cancel')"
          >取消</button>
          <button
            class="crop-btn crop-btn--confirm btn-cta font-body font-semibold cursor-pointer"
            :disabled="!ready"
            @click="confirm"
          >
            <span v-if="!ready" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            確認裁剪
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X as XIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from 'lucide-vue-next'

const props = defineProps<{ src: string }>()
const emit  = defineEmits<{
  cancel:  []
  confirm: [file: File]
}>()

// ── Constants ───────────────────────────────────────────
const CROP_W = 480
const CROP_H = 270   // 16:9

// ── State ───────────────────────────────────────────────
const viewportRef = ref<HTMLElement | null>(null)
const imgRef      = ref<HTMLImageElement | null>(null)
const naturalW    = ref(0)
const naturalH    = ref(0)
const ready       = ref(false)
const scale       = ref(1)
const panX        = ref(0)
const panY        = ref(0)

// ── Min scale: image must cover the viewport (cover fit) ─
const minScale = computed(() =>
  naturalW.value
    ? Math.max(CROP_W / naturalW.value, CROP_H / naturalH.value)
    : 1
)

const zoomPct = computed(() =>
  minScale.value ? Math.round((scale.value / minScale.value) * 100) : 100
)

// ── Image style ─────────────────────────────────────────
const imgStyle = computed(() => ({
  width:     `${naturalW.value * scale.value}px`,
  height:    `${naturalH.value * scale.value}px`,
  transform: `translate(${panX.value}px, ${panY.value}px)`,
  cursor:    isDragging.value ? 'grabbing' : 'grab',
}))

// ── On image load: init scale + center ──────────────────
function onImgLoad() {
  const img  = imgRef.value!
  naturalW.value = img.naturalWidth
  naturalH.value = img.naturalHeight
  scale.value    = minScale.value
  centerPan()
  ready.value = true
}

function centerPan() {
  panX.value = (CROP_W - naturalW.value * scale.value) / 2
  panY.value = (CROP_H - naturalH.value * scale.value) / 2
  clampPan()
}

function clampPan() {
  const rw = naturalW.value * scale.value
  const rh = naturalH.value * scale.value
  panX.value = Math.min(0, Math.max(CROP_W - rw, panX.value))
  panY.value = Math.min(0, Math.max(CROP_H - rh, panY.value))
}

// ── Zoom ────────────────────────────────────────────────
function adjustScale(delta: number) {
  const next = Math.max(minScale.value, Math.min(minScale.value * 3.5, scale.value + delta * minScale.value))
  applyScale(next)
}

function applyScale(next: number) {
  // zoom towards center of viewport
  const cx   = CROP_W / 2
  const cy   = CROP_H / 2
  const ratio = next / scale.value
  panX.value  = cx - (cx - panX.value) * ratio
  panY.value  = cy - (cy - panY.value) * ratio
  scale.value = next
  clampPan()
}

function onWheel(e: WheelEvent) {
  adjustScale(e.deltaY < 0 ? 0.04 : -0.04)
}

function onSlider(e: Event) {
  applyScale(Number((e.target as HTMLInputElement).value))
}

// ── Drag ────────────────────────────────────────────────
const isDragging = ref(false)
let dragStartX = 0
let dragStartY = 0
let dragBaseX  = 0
let dragBaseY  = 0

function onPointerDown(e: PointerEvent) {
  isDragging.value = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragBaseX  = panX.value
  dragBaseY  = panY.value
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  panX.value = dragBaseX + (e.clientX - dragStartX)
  panY.value = dragBaseY + (e.clientY - dragStartY)
  clampPan()
}

function onPointerUp() {
  isDragging.value = false
}

// ── Confirm: draw to canvas and emit File ───────────────
function confirm() {
  if (!ready.value || !imgRef.value) return

  const srcX = -panX.value / scale.value
  const srcY = -panY.value / scale.value
  const srcW = CROP_W      / scale.value
  const srcH = CROP_H      / scale.value

  const OUT_W = 1920
  const OUT_H = Math.round(OUT_W * CROP_H / CROP_W)

  const canvas  = document.createElement('canvas')
  canvas.width  = OUT_W
  canvas.height = OUT_H
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(imgRef.value, srcX, srcY, srcW, srcH, 0, 0, OUT_W, OUT_H)

  canvas.toBlob(blob => {
    if (!blob) return
    emit('confirm', new File([blob], 'cover.jpg', { type: 'image/jpeg' }))
  }, 'image/jpeg', 0.92)
}

// re-init if src changes
watch(() => props.src, () => { ready.value = false })
</script>

<style scoped>
/* ── Backdrop ──────────────────────────────────────────── */
.crop-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10,9,8,0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ── Modal box ─────────────────────────────────────────── */
.crop-modal {
  width: 100%;
  max-width: 540px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.55);
}

/* ── Header ────────────────────────────────────────────── */
.crop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--c-border);
}

/* ── Viewport ──────────────────────────────────────────── */
.crop-viewport {
  position: relative;
  width: 480px;
  height: 270px;
  margin: 16px auto;
  overflow: hidden;
  background: #000;
  cursor: grab;
  user-select: none;
  touch-action: none;
  outline: 2px solid rgba(198,172,143,0.5);
}
.crop-viewport:active { cursor: grabbing; }

.crop-img {
  position: absolute;
  top: 0; left: 0;
  display: block;
  max-width: none;
}

/* Rule-of-thirds guides */
.crop-guide {
  position: absolute;
  pointer-events: none;
  background: rgba(255,255,255,0.18);
}
.crop-guide--v { width: 1px; top: 0; bottom: 0; }
.crop-guide--h { height: 1px; left: 0; right: 0; }

/* Corner brackets */
.crop-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
}
.crop-corner.tl { top:  0; left:  0; border-top:  2px solid #c6ac8f; border-left:  2px solid #c6ac8f; }
.crop-corner.tr { top:  0; right: 0; border-top:  2px solid #c6ac8f; border-right: 2px solid #c6ac8f; }
.crop-corner.bl { bottom: 0; left:  0; border-bottom: 2px solid #c6ac8f; border-left:  2px solid #c6ac8f; }
.crop-corner.br { bottom: 0; right: 0; border-bottom: 2px solid #c6ac8f; border-right: 2px solid #c6ac8f; }

/* ── Zoom controls ─────────────────────────────────────── */
.crop-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px 12px;
}
.crop-slider {
  flex: 1;
  height: 3px;
  cursor: pointer;
  accent-color: var(--c-primary);
}
.crop-zoom-pct {
  font-size: 11px;
  color: var(--c-inkMuted);
  min-width: 38px;
  text-align: right;
}

/* ── Footer ────────────────────────────────────────────── */
.crop-footer {
  display: flex;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--c-border);
}
.crop-btn {
  flex: 1;
  padding: 9px;
  border-radius: 10px;
  font-size: 14px;
  text-align: center;
}
.crop-btn--cancel {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-inkMuted);
  transition: color 0.15s, border-color 0.15s;
}
.crop-btn--cancel:hover { color: var(--c-ink); border-color: var(--c-inkMuted); }
.crop-btn--confirm { display: flex; align-items: center; justify-content: center; gap: 8px; }
.crop-btn--confirm:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Icon buttons ──────────────────────────────────────── */
.crop-icon-btn {
  width: 32px; height: 32px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  color: var(--c-inkMuted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.crop-icon-btn:hover { background: rgba(198,172,143,0.1); color: var(--c-ink); }
.crop-icon-btn--sm { width: 26px; height: 26px; border-radius: 6px; }
</style>
