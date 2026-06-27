import { ref } from 'vue'
import type { Reactive } from 'vue'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import type { GpxLibraryEntry } from '../types'

type GpxForm = {
  name: string
  date: string
  peopleCount: number | null
  difficultyStars: number | null
  referenceUrl: string
  tags: string[]
  gpxFile: File | null
}

export type { GpxForm }

const blankForm = (): GpxForm => ({
  name: '', date: '', peopleCount: null, difficultyStars: null, referenceUrl: '', tags: [], gpxFile: null,
})

export function useGpxEditor(cardElevations: Reactive<Record<string, number[] | null>>, loadCardGpx: (e: GpxLibraryEntry) => void) {
  const store = useGpxLibraryStore()

  const form        = ref<GpxForm>(blankForm())
  const panelOpen   = ref(false)
  const editingId   = ref<string | null>(null)
  const saving      = ref(false)
  const apiError    = ref<string | null>(null)
  const fileInputEl = ref<HTMLInputElement | null>(null)
  const tagModalOpen = ref(false)

  function openCreate() {
    editingId.value = null
    form.value      = blankForm()
    apiError.value  = null
    panelOpen.value = true
  }

  function openEdit(entry: GpxLibraryEntry) {
    editingId.value = entry.id
    form.value = {
      name:            entry.name,
      date:            entry.date ?? '',
      peopleCount:     entry.peopleCount ?? null,
      difficultyStars: entry.difficultyStars ?? null,
      referenceUrl:    entry.referenceUrl ?? '',
      tags:            entry.tags ? [...entry.tags] : [],
      gpxFile:         null,
    }
    apiError.value  = null
    panelOpen.value = true
  }

  function closePanel() {
    panelOpen.value = false
    editingId.value = null
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    form.value.gpxFile = input.files?.[0] ?? null
  }

  async function submitForm() {
    if (!form.value.name.trim()) return
    if (!editingId.value && !form.value.gpxFile) return
    saving.value   = true
    apiError.value = null
    try {
      const payload = {
        name:            form.value.name.trim(),
        date:            form.value.date || null,
        difficultyStars: form.value.difficultyStars ?? null,
        peopleCount:     form.value.peopleCount ?? null,
        referenceUrl:    form.value.referenceUrl.trim() || null,
        tags:            form.value.tags,
      }
      if (editingId.value) {
        await store.updateGpxRoute(editingId.value, { ...payload, gpxFile: form.value.gpxFile })
        if (form.value.gpxFile) {
          delete cardElevations[editingId.value]
          const updated = store.gpxLibrary.find(e => e.id === editingId.value)
          if (updated) loadCardGpx(updated)
        }
      } else {
        await store.createGpxRoute({ ...payload, gpxFile: form.value.gpxFile! })
        const newest = store.gpxLibrary[0]
        if (newest) loadCardGpx(newest)
      }
      panelOpen.value = false
    } catch (e) {
      apiError.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }

  return {
    form, panelOpen, editingId, saving, apiError, fileInputEl, tagModalOpen,
    openCreate, openEdit, closePanel, onFileChange, submitForm,
  }
}
