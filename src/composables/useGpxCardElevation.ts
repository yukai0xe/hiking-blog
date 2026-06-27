import { reactive, watch } from 'vue'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import { parseGPXFromUrl } from '../services/gpx'
import type { GpxLibraryEntry } from '../types'

export function useGpxCardElevation() {
  const store = useGpxLibraryStore()

  const cardElevations = reactive<Record<string, number[] | null>>({})

  async function loadCardGpx(entry: GpxLibraryEntry) {
    try {
      const gpxData = await parseGPXFromUrl(entry.gpxFileUrl)
      cardElevations[entry.id] = gpxData.elevation
    } catch {
      cardElevations[entry.id] = null
    }
  }

  function loadAllCardGpx() {
    for (const entry of store.gpxLibrary) {
      if (!(entry.id in cardElevations)) loadCardGpx(entry)
    }
  }

  watch(() => store.gpxLibrary, (entries) => {
    for (const e of entries) {
      if (!(e.id in cardElevations)) loadCardGpx(e)
    }
  }, { deep: false })

  return { cardElevations, loadCardGpx, loadAllCardGpx }
}
