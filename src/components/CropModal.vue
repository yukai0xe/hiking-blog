<template>
  <Teleport to="body">
    <div class="crop-backdrop" @click.self="$emit('cancel')">
      <div class="crop-modal">

        <!-- Header -->
        <div class="crop-header">
          <span class="font-heading text-base font-semibold text-ink tracking-wide">裁剪封面</span>
          <div class="flex items-center gap-3">
            <span v-if="ready" class="font-mono text-xs" style="color: var(--c-inkMuted);">
              {{ naturalCropW }} × {{ naturalCropH }} px
            </span>
            <button class="crop-icon-btn" @click="$emit('cancel')" aria-label="取消">
              <XIcon :size="17" />
            </button>
          </div>
        </div>

        <!-- Viewport -->
        <div class="crop-viewport">
          <img
            ref="imgRef"
            :src="src"
            class="crop-img"
            :style="{ left: dispOffX + 'px', top: dispOffY + 'px', width: dispW + 'px', height: dispH + 'px' }"
            draggable="false"
            alt=""
            @load="onImgLoad"
          />

          <template v-if="ready">
            <!-- Dark overlay outside crop selection -->
            <div class="crop-overlay" :style="{ top: 0, left: 0, right: 0, height: cropY + 'px' }" />
            <div class="crop-overlay" :style="{ top: (cropY + cropH) + 'px', left: 0, right: 0, bottom: 0 }" />
            <div class="crop-overlay" :style="{ top: cropY + 'px', left: 0, width: cropX + 'px', height: cropH + 'px' }" />
            <div class="crop-overlay" :style="{ top: cropY + 'px', left: (cropX + cropW) + 'px', right: 0, height: cropH + 'px' }" />

            <!-- Crop selection box -->
            <div
              class="crop-box"
              :style="{ left: cropX + 'px', top: cropY + 'px', width: cropW + 'px', height: cropH + 'px' }"
              @pointerdown.stop.prevent="startDrag($event, 'move')"
            >
              <!-- Rule-of-thirds guides -->
              <div class="crop-guide crop-guide--v" style="left:33.33%" />
              <div class="crop-guide crop-guide--v" style="left:66.66%" />
              <div class="crop-guide crop-guide--h" style="top:33.33%" />
              <div class="crop-guide crop-guide--h" style="top:66.66%" />

              <!-- Resize handles -->
              <div
                v-for="dir in HANDLE_DIRS"
                :key="dir"
                :class="`crop-handle crop-handle--${dir}`"
                @pointerdown.stop.prevent="startDrag($event, dir)"
              />
            </div>
          </template>
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
import { ref, computed, watch, onUnmounted } from 'vue'
import { X as XIcon } from 'lucide-vue-next'

const props = defineProps<{ src: string }>()
const emit  = defineEmits<{ cancel: []; confirm: [file: File] }>()

// ── Constants ──────────────────────────────────────────────
const VP_W     = 480
const VP_H     = 360
const MIN_CROP = 20   // minimum selection size in viewport px

const HANDLE_DIRS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const
type HandleDir = typeof HANDLE_DIRS[number]
type DragMode  = 'move' | HandleDir

// ── State ──────────────────────────────────────────────────
const imgRef      = ref<HTMLImageElement | null>(null)
const ready       = ref(false)

const naturalW = ref(0), naturalH = ref(0)
const dispW    = ref(0), dispH    = ref(0)
const dispOffX = ref(0), dispOffY = ref(0)
const cropX    = ref(0), cropY    = ref(0)
const cropW    = ref(0), cropH    = ref(0)

// ── Computed: show natural-pixel dimensions in header ───────
const naturalCropW = computed(() =>
  ready.value ? Math.round(cropW.value * naturalW.value / dispW.value) : 0
)
const naturalCropH = computed(() =>
  ready.value ? Math.round(cropH.value * naturalH.value / dispH.value) : 0
)

// ── Image load: scale to fit viewport, init crop ────────────
function onImgLoad() {
  const img = imgRef.value!
  naturalW.value = img.naturalWidth
  naturalH.value = img.naturalHeight

  const aspect   = naturalW.value / naturalH.value
  const vpAspect = VP_W / VP_H

  if (aspect >= vpAspect) {
    dispW.value    = VP_W
    dispH.value    = VP_W / aspect
    dispOffX.value = 0
    dispOffY.value = (VP_H - dispH.value) / 2
  } else {
    dispH.value    = VP_H
    dispW.value    = VP_H * aspect
    dispOffX.value = (VP_W - dispW.value) / 2
    dispOffY.value = 0
  }

  // Initial selection = full image
  cropX.value = dispOffX.value
  cropY.value = dispOffY.value
  cropW.value = dispW.value
  cropH.value = dispH.value
  ready.value = true
}

// ── Drag ───────────────────────────────────────────────────
let dragMode: DragMode | null = null
let dragStartX = 0, dragStartY = 0
let baseX = 0, baseY = 0, baseW = 0, baseH = 0

function startDrag(e: PointerEvent, mode: DragMode) {
  dragMode   = mode
  dragStartX = e.clientX
  dragStartY = e.clientY
  baseX = cropX.value; baseY = cropY.value
  baseW = cropW.value; baseH = cropH.value
}

function onPointerMove(e: PointerEvent) {
  if (!dragMode) return
  e.preventDefault()

  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  let x = baseX, y = baseY, w = baseW, h = baseH

  const l = dispOffX.value, t = dispOffY.value
  const r = l + dispW.value, b = t + dispH.value

  if (dragMode === 'move') {
    x = Math.max(l, Math.min(r - w, baseX + dx))
    y = Math.max(t, Math.min(b - h, baseY + dy))
  } else {
    const isLeft   = dragMode === 'w'  || dragMode === 'nw' || dragMode === 'sw'
    const isRight  = dragMode === 'e'  || dragMode === 'ne' || dragMode === 'se'
    const isTop    = dragMode === 'n'  || dragMode === 'nw' || dragMode === 'ne'
    const isBottom = dragMode === 's'  || dragMode === 'sw' || dragMode === 'se'

    if (isLeft) {
      x = Math.max(l, Math.min(baseX + baseW - MIN_CROP, baseX + dx))
      w = baseX + baseW - x
    }
    if (isRight)  w = Math.max(MIN_CROP, Math.min(r - baseX, baseW + dx))
    if (isTop) {
      y = Math.max(t, Math.min(baseY + baseH - MIN_CROP, baseY + dy))
      h = baseY + baseH - y
    }
    if (isBottom) h = Math.max(MIN_CROP, Math.min(b - baseY, baseH + dy))
  }

  cropX.value = x; cropY.value = y
  cropW.value = w; cropH.value = h
}

function onPointerUp() { dragMode = null }

document.addEventListener('pointermove',   onPointerMove)
document.addEventListener('pointerup',     onPointerUp)
document.addEventListener('pointercancel', onPointerUp)

onUnmounted(() => {
  document.removeEventListener('pointermove',   onPointerMove)
  document.removeEventListener('pointerup',     onPointerUp)
  document.removeEventListener('pointercancel', onPointerUp)
})

// ── Confirm: export cropped region ─────────────────────────
function confirm() {
  if (!ready.value || !imgRef.value) return

  const scaleX = naturalW.value / dispW.value
  const scaleY = naturalH.value / dispH.value
  const srcX = (cropX.value - dispOffX.value) * scaleX
  const srcY = (cropY.value - dispOffY.value) * scaleY
  const srcW = cropW.value * scaleX
  const srcH = cropH.value * scaleY

  // Cap output at 2400px on the longer side
  const s    = Math.min(1, 2400 / Math.max(srcW, srcH))
  const outW = Math.round(srcW * s)
  const outH = Math.round(srcH * s)

  const canvas  = document.createElement('canvas')
  canvas.width  = outW
  canvas.height = outH
  canvas.getContext('2d')!.drawImage(imgRef.value, srcX, srcY, srcW, srcH, 0, 0, outW, outH)

  canvas.toBlob(
    blob => blob && emit('confirm', new File([blob], 'cover.jpg', { type: 'image/jpeg' })),
    'image/jpeg', 0.92
  )
}

watch(() => props.src, () => { ready.value = false })
</script>

<style scoped>
/* ── Backdrop ──────────────────────────────────────────────── */
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

/* ── Modal ─────────────────────────────────────────────────── */
.crop-modal {
  width: 100%;
  max-width: 540px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.55);
}

/* ── Header ────────────────────────────────────────────────── */
.crop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--c-border);
}

/* ── Viewport ──────────────────────────────────────────────── */
.crop-viewport {
  position: relative;
  width: 480px;
  height: 360px;
  margin: 16px auto;
  overflow: hidden;
  background: #111;
  user-select: none;
  touch-action: none;
}

.crop-img {
  position: absolute;
  display: block;
  max-width: none;
}

/* ── Overlay ───────────────────────────────────────────────── */
.crop-overlay {
  position: absolute;
  background: rgba(10,9,8,0.55);
  pointer-events: none;
}

/* ── Crop box ──────────────────────────────────────────────── */
.crop-box {
  position: absolute;
  outline: 1.5px solid rgba(198,172,143,0.85);
  cursor: move;
}

/* Rule-of-thirds */
.crop-guide { position: absolute; pointer-events: none; background: rgba(255,255,255,0.15); }
.crop-guide--v { width: 1px; top: 0; bottom: 0; }
.crop-guide--h { height: 1px; left: 0; right: 0; }

/* ── Resize handles ────────────────────────────────────────── */
.crop-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #c6ac8f;
  border: 1.5px solid rgba(10,9,8,0.7);
  border-radius: 2px;
}
.crop-handle--nw { top: -5px;              left: -5px;              cursor: nw-resize; }
.crop-handle--n  { top: -5px;              left: calc(50% - 5px);   cursor: n-resize;  }
.crop-handle--ne { top: -5px;              right: -5px;             cursor: ne-resize; }
.crop-handle--e  { top: calc(50% - 5px);   right: -5px;             cursor: e-resize;  }
.crop-handle--se { bottom: -5px;           right: -5px;             cursor: se-resize; }
.crop-handle--s  { bottom: -5px;           left: calc(50% - 5px);   cursor: s-resize;  }
.crop-handle--sw { bottom: -5px;           left: -5px;              cursor: sw-resize; }
.crop-handle--w  { top: calc(50% - 5px);   left: -5px;              cursor: w-resize;  }

/* ── Footer ────────────────────────────────────────────────── */
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

/* ── Icon button ───────────────────────────────────────────── */
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
</style>
