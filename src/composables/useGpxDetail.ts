import { ref, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import { parseGPXFromUrl, computeElevationStats, computeTotalDistanceKm } from '../services/gpx'
import type { GpxLibraryEntry } from '../types'

type DetailStats = {
  distanceKm: number
  totalAscent: number
  maxElevation: number
  minElevation: number
}

export function useGpxDetail() {
  const detailEntry = ref<GpxLibraryEntry | null>(null)
  const detailMapEl = ref<HTMLDivElement | null>(null)
  const detailStats = ref<DetailStats | null>(null)
  let leafletMap: L.Map | null = null

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
        L.circleMarker(latlngs[0],                  { radius: 6, fillColor: '#7fcf7f', fillOpacity: 1, color: '#fff', weight: 1.5 }).addTo(leafletMap)
        L.circleMarker(latlngs[latlngs.length - 1], { radius: 6, fillColor: '#e07070', fillOpacity: 1, color: '#fff', weight: 1.5 }).addTo(leafletMap)
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

  return { detailEntry, detailMapEl, detailStats, leafletMap, openDetail, closeDetail, initDetailMap }
}
