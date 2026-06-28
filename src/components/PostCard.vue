<template>
  <div
    class="card-wrap cursor-pointer"
    @click="$router.push(`/detail/${post.id}`)"
    @mouseenter="onHover"
    @mouseleave="isHovered = false"
  >
    <!-- Top accent rule -->
    <div class="accent-bar" />

    <!-- Image area -->
    <div class="img-wrap" :style="{ aspectRatio }">
      <!-- Compressed thumbnail — loads instantly, provides blur + aspect-ratio -->
      <img
        v-if="post.compressedCoverImage"
        :src="post.compressedCoverImage"
        class="blur-img"
        :class="{ dimmed: isHovered }"
        aria-hidden="true"
        @load="onBlurLoad"
      />
      <!-- Full quality cover -->
      <img
        :src="post.coverImage"
        :alt="post.title"
        loading="lazy"
        class="cover-img"
        :class="{ dimmed: isHovered, 'cover-full': post.compressedCoverImage, 'cover-full--ready': fullLoaded }"
        @load="fullLoaded = true"
      />


      <!-- GPX topo overlay -->
      <Transition name="topo">
        <div v-if="isHovered" class="topo-overlay">

          <!-- Map grid background -->
          <svg class="grid-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern :id="`g-${post.id}`" width="18" height="18" patternUnits="userSpaceOnUse">
                <path d="M18 0H0V18" fill="none" stroke="#c6ac8f" stroke-width="0.35" stroke-opacity="0.22" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" :fill="`url(#g-${post.id})`" />
          </svg>

          <!-- Route SVG -->
          <svg
            v-if="svg"
            :viewBox="svg.viewBox"
            class="route-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <!-- Outer glow -->
            <path :d="svg.d" fill="none" stroke="var(--c-primary)" stroke-width="9"  stroke-opacity="0.07" stroke-linecap="round" stroke-linejoin="round" />
            <path :d="svg.d" fill="none" stroke="var(--c-primary)" stroke-width="4"  stroke-opacity="0.14" stroke-linecap="round" stroke-linejoin="round" />
            <!-- Main animated draw -->
            <path
              :d="svg.d"
              fill="none"
              stroke="var(--c-primary)"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              pathLength="1"
              class="route-draw"
            />
            <!-- Start dot -->
            <circle :cx="svg.start[0]" :cy="svg.start[1]" r="3.5" fill="#7eb86a" stroke="var(--c-base)" stroke-width="1" class="dot-start" />
            <!-- End dot -->
            <circle :cx="svg.end[0]"   :cy="svg.end[1]"   r="3.5" fill="var(--c-primary)" stroke="var(--c-base)" stroke-width="1" class="dot-end" />
          </svg>

          <!-- Hiking loading animation -->
          <div v-else class="route-loader">
            <svg viewBox="0 0 44 44" class="hike-loader" xmlns="http://www.w3.org/2000/svg">
              <!-- Outer ring -->
              <circle cx="22" cy="22" r="19" fill="none" stroke="var(--c-primary)" stroke-width="1" stroke-opacity="0.3"/>
              <!-- Tick marks -->
              <line x1="22" y1="4"  x2="22" y2="7"  stroke="var(--c-primary)" stroke-width="1" stroke-opacity="0.4"/>
              <line x1="22" y1="37" x2="22" y2="40" stroke="var(--c-primary)" stroke-width="1" stroke-opacity="0.4"/>
              <line x1="4"  y1="22" x2="7"  y2="22" stroke="var(--c-primary)" stroke-width="1" stroke-opacity="0.4"/>
              <line x1="37" y1="22" x2="40" y2="22" stroke="var(--c-primary)" stroke-width="1" stroke-opacity="0.4"/>
              <!-- Rotating needle group -->
              <g>
                <animateTransform attributeName="transform" type="rotate" from="0 22 22" to="360 22 22" dur="3s" repeatCount="indefinite"/>
                <!-- North arrow (bright) -->
                <polygon points="22,5 19.5,22 24.5,22" fill="var(--c-primary)"/>
                <!-- South arrow (muted) -->
                <polygon points="22,39 19.5,22 24.5,22" fill="var(--c-primary)" opacity="0.28"/>
              </g>
              <!-- Center dot -->
              <circle cx="22" cy="22" r="2.2" fill="var(--c-primary)"/>
              <!-- N label -->
              <text x="22" y="3" text-anchor="middle" font-size="4.5" fill="var(--c-primary)" opacity="0.55" font-family="Space Mono, monospace">N</text>
            </svg>
          </div>

        </div>
      </Transition>
    </div>

    <!-- Card body -->
    <div class="card-body">
      <h3 class="card-title">{{ post.title }}</h3>
      <div class="date-row">
        <span class="date-tick" />
        <span class="card-date">{{ dateDisplay }}</span>
        <span v-if="post.difficultyStars" class="card-stars">{{ '★'.repeat(Math.min(post.difficultyStars, profile.difficultyMax)) }}</span>
      </div>
      <div v-if="post.tags && post.tags.length" class="tags-row">
        <span v-for="tag in post.tags" :key="tag" class="tag-chip">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Post } from '../types'
import { useProfileStore } from '../stores/profileStore'

const props   = defineProps<{ post: Post }>()
const profile = useProfileStore()

interface SvgData {
  d: string
  viewBox: string
  start: [number, number]
  end: [number, number]
}

const isHovered   = ref(false)
const fullLoaded  = ref(!props.post.compressedCoverImage)
const svg         = ref<SvgData | null>(null)
const aspectRatio = ref('4 / 3')
let loaded = false

function onBlurLoad(e: Event) {
  const img = e.target as HTMLImageElement
  if (img.naturalWidth && img.naturalHeight)
    aspectRatio.value = `${img.naturalWidth} / ${img.naturalHeight}`
}

async function onHover() {
  isHovered.value = true
  if (loaded || !props.post.gpxFile) return
  loaded = true

  try {
    const res  = await fetch(props.post.gpxFile)
    if (!res.ok) return
    const text = await res.text()
    const xml  = new DOMParser().parseFromString(text, 'text/xml')
    const { gpx } = await import('@tmcw/togeojson')
    const geojson  = gpx(xml)
    const feature  = geojson.features[0]

    let raw: [number, number, number][]
    if (feature?.geometry.type === 'LineString') {
      raw = feature.geometry.coordinates as [number, number, number][]
    } else if (feature?.geometry.type === 'MultiLineString') {
      raw = (feature.geometry.coordinates as [number, number, number][][]).flat()
    } else {
      return
    }

    // Simplify to max 400 pts so SVG stays snappy
    const step   = Math.max(1, Math.ceil(raw.length / 400))
    const coords = raw.filter((_, i) => i % step === 0 || i === raw.length - 1)

    const lngs  = coords.map(c => c[0])
    const lats  = coords.map(c => c[1])
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)

    const W = 240, H = 160, PAD = 20
    const rngLng = maxLng - minLng || 1e-9
    const rngLat = maxLat - minLat || 1e-9
    const scale  = Math.min((W - PAD * 2) / rngLng, (H - PAD * 2) / rngLat)
    const ox     = PAD + ((W - PAD * 2) - rngLng * scale) / 2
    const oy     = PAD + ((H - PAD * 2) - rngLat * scale) / 2

    const pts = coords.map(([lng, lat]) => {
      const x = +(ox + (lng - minLng) * scale).toFixed(2)
      const y = +(oy + (maxLat - lat) * scale).toFixed(2)
      return `${x},${y}`
    })

    const [sx, sy] = pts[0].split(',').map(Number)
    const [ex, ey] = pts[pts.length - 1].split(',').map(Number)

    svg.value = {
      d:       `M ${pts.join(' L ')}`,
      viewBox: `0 0 ${W} ${H}`,
      start:   [sx, sy],
      end:     [ex, ey],
    }
  } catch {
    // silently ignore — overlay just shows spinner indefinitely
  }
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

function fmtMonthDay(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', {
    month: '2-digit', day: '2-digit',
  })
}

const dateDisplay = computed(() => {
  const { dateStart, dateEnd } = props.post
  if (dateStart) {
    if (dateEnd && dateEnd !== dateStart) {
      return `${fmtShort(dateStart)} – ${fmtMonthDay(dateEnd)}`
    }
    return fmtShort(dateStart)
  }
  return fmtShort(props.post.created_at)
})
</script>

<style scoped>
/* ── Card shell ─────────────────────────────────────── */
.card-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--c-border);
  background: var(--c-card);
  box-shadow: 0 2px 14px var(--c-shadow), inset 0 1px 0 rgba(255,255,255,0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.card-wrap:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px var(--c-shadow);
}

/* ── Top accent bar ─────────────────────────────────── */
.accent-bar {
  height: 2px;
  background: var(--c-primary);
  opacity: 0.6;
  transition: opacity 0.25s ease;
}
.card-wrap:hover .accent-bar { opacity: 1; }

/* ── Image ──────────────────────────────────────────── */
.img-wrap { position: relative; overflow: hidden; width: 100%; }

/* Compressed thumbnail — blurred backdrop */
.blur-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(10px) sepia(0.1) contrast(1.05);
  transform: scale(1.06);
}
.blur-img.dimmed {
  filter: blur(10px) brightness(0.22) sepia(0.4) contrast(1.1);
}

/* Full-quality cover */
.cover-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: sepia(0.1) contrast(1.05);
  transition: filter 0.45s ease, transform 0.45s ease;
}
.cover-img.dimmed {
  filter: brightness(0.22) sepia(0.4) contrast(1.1);
  transform: scale(1.04);
}
.cover-full {
  opacity: 0;
  transition: opacity 0.5s ease, filter 0.45s ease, transform 0.45s ease;
}
.cover-full--ready { opacity: 1; }

/* ── GPX overlay ────────────────────────────────────── */
.topo-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.route-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.route-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hike-loader {
  width: 52px;
  height: 52px;
  filter: drop-shadow(0 0 5px var(--c-primary));
}

/* ── Route draw animation ───────────────────────────── */
.route-draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw 5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes draw { to { stroke-dashoffset: 0; } }

.dot-start {
  opacity: 0;
  animation: pop 0.3s ease-out 1.4s forwards;
}
.dot-end {
  opacity: 0;
  animation: pop 0.3s ease-out 1.55s forwards;
}
@keyframes pop {
  0%   { opacity: 0; r: 1; }
  60%  { r: 5; }
  100% { opacity: 1; r: 3.5; }
}

/* ── Overlay transition ─────────────────────────────── */
.topo-enter-active { transition: opacity 0.2s ease; }
.topo-leave-active { transition: opacity 0.15s ease; }
.topo-enter-from, .topo-leave-to { opacity: 0; }

/* ── Card body ──────────────────────────────────────── */
.card-body {
  padding: 12px 14px 14px;
}

.card-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 600;
  font-size: 15px;
  line-height: 1.3;
  color: var(--c-ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.01em;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}
.date-tick {
  display: block;
  width: 14px;
  height: 1px;
  background: var(--c-primary);
  opacity: 0.5;
  flex-shrink: 0;
}
.card-date {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--c-inkMuted);
  letter-spacing: 0.08em;
}
.card-stars {
  font-size: 10px;
  color: var(--c-primary);
  letter-spacing: -1px;
  margin-left: auto;
  opacity: 0.8;
}

@media (max-width: 639px) {
  .card-wrap {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
.tag-chip {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 99px;
  color: var(--c-primary);
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-primary) 25%, transparent);
  letter-spacing: 0.02em;
}
</style>
