import { ref, watch } from 'vue'
import { usePostStore } from '../stores/postStore'
import { useAuthStore } from '../stores/authStore'
import { safeFilename } from '../utils/gpxHelpers'

export function usePostExport() {
  const store = usePostStore()
  const auth  = useAuthStore()

  const showExportModal           = ref(false)
  const exportFormat              = ref<'json' | 'pdf'>('json')
  const includeGears              = ref(true)
  const includeFoods              = ref(true)
  const includeFoodDayAssignments = ref(true)
  const includeGpx                = ref(false)
  const exporting                 = ref(false)
  const exportError               = ref<string | null>(null)

  watch(showExportModal, (v) => { if (v) exportError.value = null })

  function exportAsJson() {
    const p = store.currentPost!
    const data: Record<string, unknown> = {
      title:           p.title,
      description:     p.description    ?? null,
      dateStart:       p.dateStart      ?? null,
      dateEnd:         p.dateEnd        ?? null,
      weather:         p.weather        ?? null,
      peopleCount:     p.peopleCount    ?? null,
      difficultyStars: p.difficultyStars ?? null,
      tags:            p.tags           ?? [],
      photos:          store.currentPhotos.map(ph => ph.url),
    }
    if (includeGears.value) {
      data.gears = store.currentGears.map(g => ({
        name:     g.name,
        category: g.category,
        brand:    g.brand     ?? null,
        weight:   g.weight,
        quantity: g.quantity,
        note:     g.note      || null,
      }))
    }
    if (includeFoods.value) {
      data.foods = store.currentFoods.map(f => ({
        name:         f.name,
        weight:       f.weight,
        quantity:     f.quantity,
        note:         f.note         || null,
        referenceUrl: f.referenceUrl ?? null,
        price:        f.price        ?? null,
      }))
      if (includeFoodDayAssignments.value) {
        data.foodDayAssignments = store.currentFoodDayAssignments.map(a => ({
          foodId:   a.foodId,
          dayIndex: a.dayIndex,
        }))
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `${safeFilename(p.title)}.json` })
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportAsPdf() {
    const p       = store.currentPost!
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    const url     = `${apiBase}/api/Posts/${p.id}/export/pdf?includeGears=${includeGears.value}&includeFoods=${includeFoods.value}&includeFoodDayAssignments=${includeFoodDayAssignments.value}`
    const headers: Record<string, string> = {}
    if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`PDF 匯出失敗 (${res.status})`)
    const blob      = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a         = Object.assign(document.createElement('a'), {
      href: objectUrl, download: `${safeFilename(p.title)}.pdf`,
    })
    a.click()
    URL.revokeObjectURL(objectUrl)
  }

  async function exportAsZip() {
    const p       = store.currentPost!
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    const url     = `${apiBase}/api/Posts/${p.id}/export/zip?format=${exportFormat.value}&includeGears=${includeGears.value}&includeFoods=${includeFoods.value}&includeFoodDayAssignments=${includeFoodDayAssignments.value}`
    const headers: Record<string, string> = {}
    if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`ZIP 匯出失敗 (${res.status})`)
    const blob      = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a         = Object.assign(document.createElement('a'), {
      href: objectUrl, download: `${safeFilename(p.title)}.zip`,
    })
    a.click()
    URL.revokeObjectURL(objectUrl)
  }

  async function doExport() {
    exporting.value   = true
    exportError.value = null
    try {
      if (includeGpx.value) await exportAsZip()
      else if (exportFormat.value === 'json') exportAsJson()
      else await exportAsPdf()
      showExportModal.value = false
    } catch (e) {
      exportError.value = (e as Error).message || '匯出失敗，請稍後再試'
    } finally {
      exporting.value = false
    }
  }

  return {
    showExportModal, exportFormat, includeGears, includeFoods,
    includeFoodDayAssignments, includeGpx, exporting, exportError,
    doExport,
  }
}
