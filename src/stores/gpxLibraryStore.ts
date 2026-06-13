import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GpxLibraryEntry } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) throw new Error(await res.text())
  return res
}

export const useGpxLibraryStore = defineStore('gpxLibrary', () => {
  const gpxLibrary = ref<GpxLibraryEntry[]>([])
  const loading    = ref(false)
  const error      = ref<string | null>(null)

  async function fetchGpxLibrary() {
    loading.value = true
    error.value   = null
    try {
      const res        = await apiFetch('/api/GpxLibrary')
      gpxLibrary.value = await res.json()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createGpxRoute(payload: {
    name:            string
    date?:           string | null
    difficultyStars?: number | null
    category?:       string | null
    peopleCount?:    number | null
    referenceUrl?:   string | null
    gpxFile:         File
  }): Promise<void> {
    const res  = await apiFetch('/api/GpxLibrary', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:            payload.name,
        date:            payload.date            ?? null,
        difficultyStars: payload.difficultyStars ?? null,
        category:        payload.category        ?? null,
        peopleCount:     payload.peopleCount      ?? null,
        referenceUrl:    payload.referenceUrl     ?? null,
      }),
    })
    const { id } = await res.json() as { id: string }

    const fd = new FormData()
    fd.append('gpxFile', payload.gpxFile)
    await apiFetch(`/api/GpxLibrary/${id}/file`, { method: 'POST', body: fd })

    await fetchGpxLibrary()
  }

  async function updateGpxRoute(id: string, payload: {
    name:            string
    date?:           string | null
    difficultyStars?: number | null
    category?:       string | null
    peopleCount?:    number | null
    referenceUrl?:   string | null
    gpxFile?:        File | null
  }): Promise<void> {
    if (payload.gpxFile) {
      const fd = new FormData()
      fd.append('gpxFile', payload.gpxFile)
      await apiFetch(`/api/GpxLibrary/${id}/file`, { method: 'POST', body: fd })
    }

    await apiFetch(`/api/GpxLibrary/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:            payload.name,
        date:            payload.date            ?? null,
        difficultyStars: payload.difficultyStars ?? null,
        category:        payload.category        ?? null,
        peopleCount:     payload.peopleCount      ?? null,
        referenceUrl:    payload.referenceUrl     ?? null,
      }),
    })

    await fetchGpxLibrary()
  }

  async function deleteGpxRoute(id: string): Promise<void> {
    await apiFetch(`/api/GpxLibrary/${id}`, { method: 'DELETE' })
    gpxLibrary.value = gpxLibrary.value.filter(e => e.id !== id)
  }

  return { gpxLibrary, loading, error, fetchGpxLibrary, createGpxRoute, updateGpxRoute, deleteGpxRoute }
})
