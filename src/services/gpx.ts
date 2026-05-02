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
