import { gpx as gpxToGeoJSON } from '@tmcw/togeojson'
import type { GpxData, ElevationStats } from '../types'

export function parseGPX(file: File): Promise<GpxData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const xml = new DOMParser().parseFromString(
          e.target!.result as string,
          'text/xml'
        )
        const geojson = gpxToGeoJSON(xml)
        const feature = geojson.features[0]

        if (!feature || feature.geometry.type !== 'LineString') {
          throw new Error('Invalid GPX: no LineString track found')
        }

        const coords = feature.geometry.coordinates as [number, number, number][]
        const coordinates: [number, number][] = coords.map(([lng, lat]) => [lat, lng])
        const elevation: number[] = coords.map(([, , ele]) => ele ?? 0)

        const times: string[] = feature.properties?.coordTimes ?? []
        const timestamps: Date[] = times.map((t) => new Date(t))

        resolve({ coordinates, elevation, timestamps })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function computeElevationStats(elevation: number[]): ElevationStats {
  if (elevation.length === 0) {
    return { totalAscent: 0, maxElevation: 0, minElevation: 0 }
  }

  let totalAscent = 0
  for (let i = 1; i < elevation.length; i++) {
    const diff = elevation[i] - elevation[i - 1]
    if (diff > 0) totalAscent += diff
  }

  return {
    totalAscent: Math.round(totalAscent),
    maxElevation: Math.round(Math.max(...elevation)),
    minElevation: Math.round(Math.min(...elevation)),
  }
}

// ── GPX Library utilities ───────────────────────────────

function parseGPXXml(xml: Document): GpxData {
  const geojson = gpxToGeoJSON(xml)
  const feature = geojson.features[0]
  if (!feature) throw new Error('No GPX track found')

  let rawCoords: [number, number, number][]
  if (feature.geometry.type === 'LineString') {
    rawCoords = feature.geometry.coordinates as [number, number, number][]
  } else if (feature.geometry.type === 'MultiLineString') {
    rawCoords = (feature.geometry.coordinates as [number, number, number][][]).flat()
  } else {
    throw new Error('Unsupported GPX geometry type')
  }

  const coordinates: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng])
  const elevation: number[]             = rawCoords.map(([, , ele]) => ele ?? 0)
  const times: string[]                 = [feature.properties?.coordTimes ?? []].flat(2)
  const timestamps: Date[]              = times.map(t => new Date(t))

  return { coordinates, elevation, timestamps }
}

export async function parseGPXFromUrl(url: string): Promise<GpxData> {
  const res  = await fetch(url)
  const text = await res.text()
  const xml  = new DOMParser().parseFromString(text, 'text/xml')
  return parseGPXXml(xml)
}

export function downsampleCoords(coords: [number, number][], maxPoints: number): [number, number][] {
  if (coords.length <= maxPoints) return coords
  const step = coords.length / maxPoints
  return Array.from({ length: maxPoints }, (_, i) => coords[Math.floor(i * step)])
}

export function gpxCoordsToSvgPath(
  coords: [number, number][],
  viewSize = 200,
  padding  = 15,
): { d: string; start: [number, number]; end: [number, number] } {
  if (coords.length < 2) return { d: '', start: [0, 0], end: [0, 0] }

  const lats   = coords.map(c => c[0])
  const lngs   = coords.map(c => c[1])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const rangeW = maxLng - minLng || 1e-9
  const rangeH = maxLat - minLat || 1e-9
  const scale  = (viewSize - padding * 2) / Math.max(rangeW, rangeH)

  const toSvg = ([lat, lng]: [number, number]): [number, number] => [
    +(padding + (lng - minLng) * scale).toFixed(2),
    +(viewSize - padding - (lat - minLat) * scale).toFixed(2),
  ]

  const pts = coords.map(toSvg)
  const d   = 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ')

  return { d, start: pts[0], end: pts[pts.length - 1] }
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R    = 6371000
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const lat1 = a[0] * Math.PI / 180
  const lat2 = b[0] * Math.PI / 180
  const x    = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function computeTotalDistanceKm(coords: [number, number][]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) total += haversineMeters(coords[i - 1], coords[i])
  return Math.round(total / 100) / 10
}
