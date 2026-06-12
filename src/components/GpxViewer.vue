<template>
  <div style="height: inherit;">
    <div v-if="loading" class="text-center text-inkMuted py-8 font-body">載入 GPX 中…</div>
    <div v-else-if="error" class="text-center py-8 font-body" style="color: #e07070;">{{ error }}</div>

    <div v-else class="relative w-full overflow-hidden" style="height: 100%;">

      <!-- Leaflet map -->
      <div ref="mapEl" class="absolute inset-0" />

      <!-- Add-mode tooltip overlay -->
      <Transition name="add-hint">
        <div
          v-if="addMode"
          class="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
        >
          <div
            class="flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm"
            style="background: color-mix(in srgb, var(--c-base) 88%, transparent); backdrop-filter: blur(10px); border: 1px solid color-mix(in srgb, var(--c-primary) 50%, transparent); color: var(--c-primary); box-shadow: 0 4px 20px rgba(0,0,0,0.4);"
          >
            <div class="w-2 h-2 rounded-full animate-pulse" style="background: var(--c-primary);" />
            點擊地圖任意位置新增記錄點
          </div>
        </div>
      </Transition>

      <!-- Right-side column: layer toggle + info panel -->
      <div class="absolute top-4 right-4 z-[1000] flex flex-col gap-2 w-72">

        <!-- Layer toggle -->
        <button
          class="self-end flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-body cursor-pointer transition-colors duration-150"
          style="background: color-mix(in srgb, var(--c-card) 92%, transparent); backdrop-filter: blur(10px); border: 1px solid var(--c-border); color: var(--c-inkMuted);"
          @click="toggleLayer"
        >
          <LayersIcon :size="13" />
          {{ isTopo ? '街道圖' : '等高線圖' }}
        </button>

        <!-- Unified info panel -->
        <Transition name="panel">
          <div
            v-if="selected"
            class="rounded-xl overflow-hidden"
            style="background: color-mix(in srgb, var(--c-card) 92%, transparent); backdrop-filter: blur(10px); border: 1px solid var(--c-border);"
          >
          <!-- Header -->
          <div class="flex items-start justify-between gap-2 px-4 pt-4 pb-3" style="border-bottom: 1px solid var(--c-border);">
            <div class="min-w-0">
              <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted opacity-60 mb-0.5">
                {{ selected.kind === 'peak' ? '山頭' : selected.kind === 'shelter' ? selected.desc : '記錄點' }}
              </p>
              <h3 class="font-heading text-base font-semibold text-ink leading-tight truncate">
                {{ selected.name || '未命名' }}
              </h3>
            </div>
            <button
              class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-inkMuted hover:text-ink transition-colors cursor-pointer mt-0.5"
              style="border: 1px solid var(--c-border);"
              @click="selectItem(null)"
            >
              <XIcon :size="12" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-4 py-3 space-y-2.5">
            <div v-if="selected.desc" class="text-sm font-body text-inkMuted leading-relaxed italic">
              {{ selected.desc }}
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div v-if="selected.ele !== null" class="rounded-lg px-3 py-2" style="background: color-mix(in srgb, var(--c-surface) 50%, transparent);">
                <p class="text-[9px] uppercase tracking-widest text-inkMuted opacity-60 mb-0.5">海拔</p>
                <p class="font-mono text-sm text-primary font-bold">{{ selected.ele }} m</p>
              </div>
              <div class="rounded-lg px-3 py-2" style="background: color-mix(in srgb, var(--c-surface) 50%, transparent);">
                <p class="text-[9px] uppercase tracking-widest text-inkMuted opacity-60 mb-0.5">座標</p>
                <p class="font-mono text-[10px] text-ink leading-tight">
                  {{ selected.lat.toFixed(5) }}<br>{{ selected.lng.toFixed(5) }}
                </p>
              </div>
            </div>

            <div v-if="selected.time" class="flex items-center gap-1.5">
              <ClockIcon :size="11" class="text-inkMuted opacity-50 shrink-0" />
              <span class="font-mono text-[10px] text-inkMuted">{{ formatTime(selected.time) }}</span>
            </div>
          </div>

          <!-- Waypoint navigation -->
          <div v-if="selected.kind === 'waypoint' && waypoints.length > 1"
            class="flex items-center justify-between px-4 py-2.5"
            style="border-top: 1px solid var(--c-border);"
          >
            <button class="text-[10px] font-body text-inkMuted hover:text-ink transition-colors cursor-pointer disabled:opacity-30"
              :disabled="wptIndex <= 0" @click="goToWpt(wptIndex - 1)">← 上一個</button>
            <span class="font-mono text-[10px] text-inkMuted">{{ wptIndex + 1 }} / {{ waypoints.length }}</span>
            <button class="text-[10px] font-body text-inkMuted hover:text-ink transition-colors cursor-pointer disabled:opacity-30"
              :disabled="wptIndex >= waypoints.length - 1" @click="goToWpt(wptIndex + 1)">下一個 →</button>
          </div>
        </div>
        </Transition>

      </div><!-- end right column -->

      <!-- Elevation panel (bottom) -->
      <div
        class="absolute bottom-4 left-4 right-4 z-[1000] rounded-xl overflow-hidden"
        style="background: color-mix(in srgb, var(--c-card) 88%, transparent); backdrop-filter: blur(8px); border: 1px solid var(--c-border);"
      >
        <button class="w-full flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer" @click="showElevation = !showElevation">
          <div class="flex items-center gap-4 min-w-0 flex-1">
            <span class="flex items-center gap-1.5 text-xs font-body text-inkMuted whitespace-nowrap">
              <span class="text-[10px] uppercase tracking-widest opacity-60">總爬升</span>
              <strong class="font-mono" style="color: var(--c-cta);">{{ elevationStats?.totalAscent ?? '—' }} m</strong>
            </span>
            <span class="flex items-center gap-1.5 text-xs font-body text-inkMuted whitespace-nowrap">
              <span class="text-[10px] uppercase tracking-widest opacity-60">最高點</span>
              <strong class="font-mono text-primary">{{ elevationStats?.maxElevation ?? '—' }} m</strong>
            </span>
            <span class="flex items-center gap-1.5 text-xs font-body text-inkMuted whitespace-nowrap">
              <span class="text-[10px] uppercase tracking-widest opacity-60">最低點</span>
              <strong class="font-mono text-ink">{{ elevationStats?.minElevation ?? '—' }} m</strong>
            </span>
          </div>
          <ChevronDownIcon :size="15" class="text-inkMuted shrink-0 transition-transform duration-200" :class="{ 'rotate-180': showElevation }" />
        </button>
        <Transition name="slide">
          <div v-if="showElevation" style="border-top: 1px solid var(--c-border);">
            <ElevationChart :elevation="gpxData?.elevation ?? []" />
          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ChevronDown as ChevronDownIcon, X as XIcon, Clock as ClockIcon, Layers as LayersIcon } from 'lucide-vue-next'
import ElevationChart from './ElevationChart.vue'
import { computeElevationStats } from '../services/gpx'
import type { GpxData, Waypoint, WaypointOverride } from '../types'

// ── Unified panel item ────────────────────────────────────
interface PanelItem {
  kind:      'waypoint' | 'peak' | 'shelter'
  id:        number
  name:      string
  desc:      string
  lat:       number
  lng:       number
  ele:       number | null
  time:      Date | null
  isCustom?: boolean
}

const props = defineProps<{ gpxUrl: string; showPeaks?: boolean; showWaypoints?: boolean; showShelters?: boolean; overrides?: WaypointOverride[]; addMode?: boolean }>()
const emit  = defineEmits<{ 'waypoints-ready': [wpts: Waypoint[]]; 'add-waypoint': [pos: { lat: number; lng: number }] }>()

const mapEl         = ref<HTMLElement | null>(null)
const gpxData       = ref<GpxData | null>(null)
const loading       = ref(true)
const error         = ref<string | null>(null)
const showElevation = ref(false)
const waypoints     = ref<PanelItem[]>([])
const selected      = ref<PanelItem | null>(null)
let map: L.Map | null = null
let tileLayer: L.TileLayer | null = null
let wptLayerGroup:     L.LayerGroup | null = null
let peakLayerGroup:    L.LayerGroup | null = null
let shelterLayerGroup: L.LayerGroup | null = null
let mapReady = false
const isTopo = ref(false)

const wptMarkers  = new Map<number, L.Marker>()
const peakMarkers = new Map<number, L.Marker>()

const TILES = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors, © OpenTopoMap (CC-BY-SA)',
  },
}

watch(() => props.showWaypoints, v => {
  if (!map || !wptLayerGroup) return
  v !== false ? wptLayerGroup.addTo(map) : wptLayerGroup.remove()
})
watch(() => props.showPeaks, v => {
  if (!map || !peakLayerGroup) return
  v !== false ? peakLayerGroup.addTo(map) : peakLayerGroup.remove()
})
watch(() => props.showShelters, v => {
  if (!map || !shelterLayerGroup) return
  v !== false ? shelterLayerGroup.addTo(map) : shelterLayerGroup.remove()
})
watch(() => props.addMode, v => {
  if (!map) return
  map.getContainer().style.cursor = v ? 'crosshair' : ''
})

// Reactive fallback: sync custom waypoints whenever overrides change.
// The imperative addWaypointMarker call in Detail.vue is the fast path;
// this watcher catches cases where the map wasn't ready at call time.
watch(() => props.overrides, (overrides) => {
  if (!mapReady) return
  for (const ov of (overrides ?? [])) {
    if (!ov.isCustom || ov.hidden) continue
    const alreadyOnMap = waypoints.value.some(
      w => Math.abs(w.lat - ov.lat) < 1e-5 && Math.abs(w.lng - ov.lng) < 1e-5
    )
    if (!alreadyOnMap) addWaypointMarker(ov.lat, ov.lng, ov.name, ov.description, true)
  }
}, { deep: true })

function toggleLayer() {
  if (!map) return
  isTopo.value = !isTopo.value
  tileLayer?.remove()
  const t = isTopo.value ? TILES.topo : TILES.standard
  tileLayer = L.tileLayer(t.url, { attribution: t.attribution }).addTo(map)
  tileLayer.bringToBack()
}

// ── Stats ─────────────────────────────────────────────────
const elevationStats = computed(() =>
  gpxData.value ? computeElevationStats(gpxData.value.elevation) : null
)

const wptIndex = computed(() =>
  selected.value?.kind === 'waypoint'
    ? waypoints.value.findIndex(w => w.id === selected.value!.id)
    : -1
)

// ── Icons ─────────────────────────────────────────────────
function wptIcon(active: boolean) {
  const size   = active ? 20 : 16
  const bg     = active ? '#ff6b35' : '#c6ac8f'
  const shadow = active
    ? '0 0 0 4px rgba(255,107,53,0.25), 0 2px 8px rgba(0,0,0,0.6)'
    : '0 1px 6px rgba(0,0,0,0.55)'
  return L.divIcon({
    className: '',
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;background:${bg};transform:rotate(45deg);border:2px solid white;box-shadow:${shadow};cursor:pointer;transition:all .15s ease;"></div>`,
  })
}

function customWptIcon(active: boolean) {
  const size   = active ? 20 : 16
  const bg     = active ? '#ff6b35' : '#7eb86a'
  const shadow = active
    ? '0 0 0 4px rgba(255,107,53,0.25), 0 2px 8px rgba(0,0,0,0.6)'
    : '0 1px 6px rgba(0,0,0,0.55)'
  return L.divIcon({
    className: '',
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border-radius:50%;border:2px solid white;box-shadow:${shadow};cursor:pointer;transition:all .15s ease;"></div>`,
  })
}

function peakIcon(active: boolean) {
  const fill   = active ? '#ff6b35' : '#c6ac8f'
  const size   = active ? 22 : 18
  const filter = active ? 'drop-shadow(0 0 4px rgba(255,107,53,0.6))' : 'none'
  return L.divIcon({
    className:  '',
    iconAnchor: [size / 2, size],
    html: `<svg width="${size}" height="${Math.round(size * 0.88)}" viewBox="0 0 18 16" xmlns="http://www.w3.org/2000/svg" style="filter:${filter}">
      <polygon points="9,1 17,15 1,15" fill="${fill}" fill-opacity="${active ? 1 : 0.85}" stroke="white" stroke-width="1.4" stroke-linejoin="round"/>
    </svg>`,
  })
}

// ── Selection ─────────────────────────────────────────────
function selectItem(item: PanelItem | null) {
  if (selected.value) {
    if (selected.value.kind === 'waypoint')
      wptMarkers.get(selected.value.id)?.setIcon(selected.value.isCustom ? customWptIcon(false) : wptIcon(false))
    else
      peakMarkers.get(selected.value.id)?.setIcon(peakIcon(false))
  }
  selected.value = item
  if (item) {
    if (item.kind === 'waypoint')
      wptMarkers.get(item.id)?.setIcon(item.isCustom ? customWptIcon(true) : wptIcon(true))
    else
      peakMarkers.get(item.id)?.setIcon(peakIcon(true))
  }
}

function goToWpt(i: number) {
  const wpt = waypoints.value[i]
  if (!wpt || !map) return
  selectItem(wpt)
  map.panTo([wpt.lat, wpt.lng])
}

function formatTime(d: Date) {
  return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── Load ──────────────────────────────────────────────────
async function loadAndRender() {
  try {
    const res = await fetch(props.gpxUrl)
    if (!res.ok) throw new Error(`無法載入 GPX 檔案 (${res.status})`)
    const text = await res.text()
    const xml  = new DOMParser().parseFromString(text, 'text/xml')

    const { gpx: gpxToGeoJSON } = await import('@tmcw/togeojson')
    const geojson = gpxToGeoJSON(xml)

    const trackFeature = geojson.features.find(
      f => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'
    )
    if (!trackFeature) throw new Error('找不到有效的 GPX 軌跡')

    type TrackGeom = import('geojson').LineString | import('geojson').MultiLineString
    const trackGeom = trackFeature.geometry as TrackGeom
    let rawCoords: [number, number, number][]
    if (trackGeom.type === 'LineString') {
      rawCoords = trackGeom.coordinates as [number, number, number][]
    } else {
      rawCoords = (trackGeom.coordinates as [number, number, number][][]).flat()
    }

    const coordinates: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng])
    const elevation:   number[]           = rawCoords.map(([, , ele]) => ele ?? 0)
    const times:       string[]           = trackFeature.properties?.coordTimes ?? []

    gpxData.value = { coordinates, elevation, timestamps: times.map(t => new Date(t)) }

    // Parse GPX waypoints
    const gpxWpts = geojson.features
      .filter(f => f.geometry.type === 'Point')
      .map<PanelItem>((f, i) => {
        const [lng, lat, ele] = (f.geometry as { type: 'Point'; coordinates: number[] }).coordinates as [number, number, number?]
        return {
          kind: 'waypoint' as const,
          id:   i,
          name: f.properties?.name ?? '',
          desc: f.properties?.desc ?? '',
          lat, lng,
          ele:  ele != null ? Math.round(ele) : null,
          time: f.properties?.time ? new Date(f.properties.time) : null,
        }
      })

    // Apply overrides: skip hidden from map, merge name/desc, collect all for emit
    const allForEmit: import('../types').Waypoint[] = []
    waypoints.value = []
    for (const wpt of gpxWpts) {
      const ov       = props.overrides?.find(o => Math.abs(o.lat - wpt.lat) < 1e-5 && Math.abs(o.lng - wpt.lng) < 1e-5)
      const isHidden = ov?.hidden ?? false
      if (ov) {
        if (ov.name) wpt.name = ov.name           // empty string means no rename yet — keep original GPX name
        if (ov.description) wpt.desc = ov.description
        if (ov.isCustom) wpt.isCustom = true
        if (ov.time) wpt.time = new Date(ov.time)
      }
      allForEmit.push({ name: wpt.name, desc: wpt.desc, lat: wpt.lat, lng: wpt.lng, ele: wpt.ele, time: wpt.time, hidden: isHidden })
      if (!isHidden) waypoints.value.push(wpt)
    }

    // Reconstruct non-custom hidden waypoints removed from GPX by a prior sync
    for (const ov of (props.overrides ?? [])) {
      if (ov.isCustom || !ov.hidden) continue
      const alreadyEmitted = allForEmit.some(w => Math.abs(w.lat - ov.lat) < 1e-5 && Math.abs(w.lng - ov.lng) < 1e-5)
      if (!alreadyEmitted)
        allForEmit.push({ name: ov.name, desc: ov.description, lat: ov.lat, lng: ov.lng, ele: null, time: ov.time ? new Date(ov.time) : null, hidden: true })
    }

    // Add custom waypoints (not in GPX file) from overrides
    let nextId = gpxWpts.length
    for (const ov of (props.overrides ?? [])) {
      if (!ov.isCustom) continue
      const exists = gpxWpts.some(w => Math.abs(w.lat - ov.lat) < 1e-5 && Math.abs(w.lng - ov.lng) < 1e-5)
      if (!exists) {
        const ovTime = ov.time ? new Date(ov.time) : null
        allForEmit.push({ name: ov.name, desc: ov.description, lat: ov.lat, lng: ov.lng, ele: null, time: ovTime, hidden: ov.hidden })
        if (!ov.hidden) waypoints.value.push({ kind: 'waypoint', id: nextId++, name: ov.name, desc: ov.description, lat: ov.lat, lng: ov.lng, ele: null, time: ovTime, isCustom: true })
      }
    }

    loading.value = false
    emit('waypoints-ready', allForEmit)
    await nextTick()
    renderMap(coordinates)
    fetchPeaks(coordinates)
    fetchShelters(coordinates)
  } catch (e) {
    error.value   = (e as Error).message
    loading.value = false
  }
}

// ── Map ───────────────────────────────────────────────────
function renderMap(coordinates: [number, number][]) {
  if (!mapEl.value || coordinates.length === 0) return

  map = L.map(mapEl.value)
  tileLayer      = L.tileLayer(TILES.standard.url, { attribution: TILES.standard.attribution }).addTo(map)
  wptLayerGroup     = L.layerGroup().addTo(map)
  peakLayerGroup    = L.layerGroup().addTo(map)
  shelterLayerGroup = L.layerGroup().addTo(map)

  L.polyline(coordinates, { color: '#ff6b35', weight: 10, opacity: 0.18 }).addTo(map)
  L.polyline(coordinates, { color: '#ff6b35', weight: 5,  opacity: 0.35 }).addTo(map)
  const polyline = L.polyline(coordinates, { color: '#ff6b35', weight: 2.5, opacity: 1 }).addTo(map)
  map.fitBounds(polyline.getBounds(), { padding: [20, 20] })

  const startIcon = L.divIcon({ className: '', html: '<div style="width:10px;height:10px;background:#7eb86a;border-radius:50%;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.6)"></div>' })
  const endIcon   = L.divIcon({ className: '', html: '<div style="width:10px;height:10px;background:#ff6b35;border-radius:50%;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.6)"></div>' })
  L.marker(coordinates[0], { icon: startIcon }).addTo(map).bindTooltip('起點', { permanent: false })
  L.marker(coordinates[coordinates.length - 1], { icon: endIcon }).addTo(map).bindTooltip('終點', { permanent: false })

  waypoints.value.forEach(wpt => {
    const icon = wpt.isCustom ? customWptIcon(false) : wptIcon(false)
    const marker = L.marker([wpt.lat, wpt.lng], { icon }).addTo(wptLayerGroup!)
    if (wpt.name) marker.bindTooltip(wpt.name, { permanent: false, direction: 'top', offset: [0, -10] })
    marker.on('click', () => { selectItem(wpt); map!.panTo([wpt.lat, wpt.lng]) })
    wptMarkers.set(wpt.id, marker)
  })

  map.on('click', (e: L.LeafletMouseEvent) => {
    if (props.addMode) emit('add-waypoint', { lat: e.latlng.lat, lng: e.latlng.lng })
  })

  mapReady = true
}

// ── Peaks ─────────────────────────────────────────────────
async function fetchPeaks(coordinates: [number, number][]) {
  if (!map) return
  try {
    // Use reduce to avoid spread stack-overflow on large GPS tracks
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
    for (const [lat, lng] of coordinates) {
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
    }
    const PAD   = 0.09  // ≈ 10 km
    const south = (minLat - PAD).toFixed(5)
    const north = (maxLat + PAD).toFixed(5)
    const west  = (minLng - PAD).toFixed(5)
    const east  = (maxLng + PAD).toFixed(5)

    const query = `[out:json][timeout:25];node["natural"="peak"](${south},${west},${north},${east});out body;`
    const res   = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
    if (!res.ok) return
    const data  = await res.json()

    data.elements.forEach((peak: { lat: number; lon: number; tags?: Record<string, string> }, i: number) => {
      const name = peak.tags?.['name:zh'] || peak.tags?.name || ''
      const ele  = peak.tags?.ele ? Math.round(Number(peak.tags.ele)) : null
      const item: PanelItem = {
        kind: 'peak',
        id:   i,
        name,
        desc: '',
        lat:  peak.lat,
        lng:  peak.lon,
        ele,
        time: null,
      }

      const marker = L.marker([peak.lat, peak.lon], { icon: peakIcon(false) }).addTo(peakLayerGroup!)
      const tip    = [name, ele != null ? `${ele} m` : ''].filter(Boolean).join(' · ')
      if (tip) marker.bindTooltip(tip, { permanent: false, direction: 'top', offset: [0, -4], className: 'peak-tip' })
      marker.on('click', () => { selectItem(item); map!.panTo([peak.lat, peak.lon]) })
      peakMarkers.set(i, marker)
    })
  } catch { /* Overpass unavailable */ }
}

async function fetchShelters(coordinates: [number, number][]) {
  if (!map) return
  try {
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
    for (const [lat, lng] of coordinates) {
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng
    }
    const PAD   = 0.09
    const south = (minLat - PAD).toFixed(5), north = (maxLat + PAD).toFixed(5)
    const west  = (minLng - PAD).toFixed(5), east  = (maxLng + PAD).toFixed(5)
    const bbox  = `${south},${west},${north},${east}`

    const query = `[out:json][timeout:25];(node["tourism"~"^(alpine_hut|wilderness_hut|hostel)$"](${bbox});node["tourism"="camp_site"](${bbox});node["amenity"="shelter"](${bbox});node["emergency"="shelter"](${bbox}););out body;`
    const res   = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
    if (!res.ok) return
    const data  = await res.json()

    data.elements.forEach((el: { lat: number; lon: number; tags?: Record<string, string> }, i: number) => {
      const tourism  = el.tags?.tourism ?? ''
      const amenity  = el.tags?.amenity ?? ''
      const emergency = el.tags?.emergency ?? ''
      const isHut    = tourism === 'alpine_hut' || tourism === 'wilderness_hut'
                    || tourism === 'hostel'
                    || amenity === 'shelter' || emergency === 'shelter'
      const color    = isHut ? '#e8a030' : '#7eb86a'
      const name     = el.tags?.['name:zh'] || el.tags?.name || (isHut ? '山屋' : '營地')
      const ele      = el.tags?.ele ? Math.round(Number(el.tags.ele)) : null
      const kind     = tourism === 'hostel' ? '山莊'
                     : emergency === 'shelter' ? '避難山屋'
                     : amenity === 'shelter' || isHut ? '山屋'
                     : '營地'

      const item: PanelItem = {
        kind: 'shelter', id: i, name,
        desc: kind,
        lat: el.lat, lng: el.lon, ele, time: null,
      }

      const icon = L.divIcon({
        className:  '',
        iconAnchor: [6, 6],
        html: `<div style="width:12px;height:12px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.55);cursor:pointer;"></div>`,
      })
      const tip    = [name, ele != null ? `${ele} m` : ''].filter(Boolean).join(' · ')
      const marker = L.marker([el.lat, el.lon], { icon }).addTo(shelterLayerGroup!)
      if (tip) marker.bindTooltip(tip, { permanent: false, direction: 'top', offset: [0, -4], className: 'peak-tip' })
      marker.on('click', () => { selectItem(item); map!.panTo([el.lat, el.lon]) })
    })
  } catch { /* Overpass unavailable */ }
}

function updateWaypoint(lat: number, lng: number, name: string, desc: string, time?: Date | null) {
  const wpt = waypoints.value.find(
    w => Math.abs(w.lat - lat) < 1e-6 && Math.abs(w.lng - lng) < 1e-6
  )
  if (!wpt) return
  wpt.name = name
  wpt.desc = desc
  if (time !== undefined) wpt.time = time
  // Refresh marker tooltip
  const marker = wptMarkers.get(wpt.id)
  if (marker) {
    marker.unbindTooltip()
    if (name) marker.bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -10] })
  }
  // If this waypoint is open in the panel, keep it in sync
  if (selected.value?.id === wpt.id && selected.value.kind === 'waypoint') {
    selected.value = { ...selected.value, name, desc, ...(time !== undefined && { time }) }
  }
}

function addWaypointMarker(lat: number, lng: number, name: string, desc: string, isCustom = true) {
  if (!map || !wptLayerGroup) return
  const id = waypoints.value.length > 0 ? Math.max(...waypoints.value.map(w => w.id)) + 1 : 0
  const item: PanelItem = { kind: 'waypoint', id, name, desc, lat, lng, ele: null, time: null, isCustom }
  waypoints.value.push(item)
  const icon   = isCustom ? customWptIcon(false) : wptIcon(false)
  const marker = L.marker([lat, lng], { icon }).addTo(wptLayerGroup)
  if (name) marker.bindTooltip(name, { permanent: false, direction: 'top', offset: [0, -10] })
  marker.on('click', () => { selectItem(item); map!.panTo([lat, lng]) })
  wptMarkers.set(id, marker)
}

function removeWaypointMarker(lat: number, lng: number) {
  const wpt = waypoints.value.find(w => Math.abs(w.lat - lat) < 1e-5 && Math.abs(w.lng - lng) < 1e-5)
  if (!wpt) return
  wptMarkers.get(wpt.id)?.remove()
  wptMarkers.delete(wpt.id)
  waypoints.value = waypoints.value.filter(w => w.id !== wpt.id)
  if (selected.value?.id === wpt.id) selected.value = null
}

function selectWaypoint(lat: number, lng: number) {
  const wpt = waypoints.value.find(
    w => Math.abs(w.lat - lat) < 1e-5 && Math.abs(w.lng - lng) < 1e-5
  )
  if (!wpt || !map) return
  selectItem(wpt)
  map.panTo([wpt.lat, wpt.lng])
}

defineExpose({ updateWaypoint, addWaypointMarker, removeWaypointMarker, selectWaypoint })

onMounted(loadAndRender)
onUnmounted(() => { map?.remove(); wptMarkers.clear(); peakMarkers.clear(); mapReady = false })
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(8px); }

.panel-enter-active, .panel-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.panel-enter-from, .panel-leave-to { opacity: 0; transform: translateX(12px); }

.add-hint-enter-active, .add-hint-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.add-hint-enter-from, .add-hint-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>

<style>
.peak-tip {
  background: #1a2830ee !important;
  border: 1px solid #5e503f !important;
  color: #c6ac8f !important;
  font-family: 'Space Mono', monospace !important;
  font-size: 11px !important;
  padding: 3px 7px !important;
  border-radius: 6px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.5) !important;
  white-space: nowrap !important;
}
.peak-tip::before { display: none !important; }
</style>
