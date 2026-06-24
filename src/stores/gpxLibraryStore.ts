import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GpxLibraryEntry } from '../types'
import { useAuthStore } from './authStore'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const auth    = useAuthStore()
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> ?? {}) }
  if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
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
    peopleCount?:    number | null
    referenceUrl?:   string | null
    tags?:           string[] | null
    isWishlist?:     boolean
    gpxFile:         File
  }): Promise<void> {
    const res  = await apiFetch('/api/GpxLibrary', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:            payload.name,
        date:            payload.date            ?? null,
        difficultyStars: payload.difficultyStars ?? null,
        peopleCount:     payload.peopleCount      ?? null,
        referenceUrl:    payload.referenceUrl     ?? null,
        tags:            payload.tags             ?? [],
        isWishlist:      payload.isWishlist       ?? false,
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
    peopleCount?:    number | null
    referenceUrl?:   string | null
    tags?:           string[] | null
    isWishlist?:     boolean
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
        peopleCount:     payload.peopleCount      ?? null,
        referenceUrl:    payload.referenceUrl     ?? null,
        tags:            payload.tags             ?? [],
        isWishlist:      payload.isWishlist       ?? false,
      }),
    })

    await fetchGpxLibrary()
  }

  async function toggleWishlist(id: string): Promise<void> {
    const entry = gpxLibrary.value.find(e => e.id === id)
    if (!entry) return
    const prev = entry.isWishlist ?? false
    entry.isWishlist = !prev
    try {
      await apiFetch(`/api/GpxLibrary/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:            entry.name,
          date:            entry.date            ?? null,
          difficultyStars: entry.difficultyStars ?? null,
          peopleCount:     entry.peopleCount      ?? null,
          referenceUrl:    entry.referenceUrl     ?? null,
          tags:            entry.tags             ?? [],
          isWishlist:      !prev,
        }),
      })
    } catch (e) {
      entry.isWishlist = prev
      throw e
    }
  }

  async function deleteGpxRoute(id: string): Promise<void> {
    await apiFetch(`/api/GpxLibrary/${id}`, { method: 'DELETE' })
    gpxLibrary.value = gpxLibrary.value.filter(e => e.id !== id)
  }

  async function reorderRoutes(items: { id: string; order: number }[]): Promise<void> {
    // Apply optimistically so the UI updates immediately on drop
    const prev = items.map(({ id }) => {
      const e = gpxLibrary.value.find(x => x.id === id)
      return { id, order: e?.sortOrder ?? 0 }
    })
    items.forEach(({ id, order }) => {
      const e = gpxLibrary.value.find(x => x.id === id)
      if (e) e.sortOrder = order
    })
    gpxLibrary.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    try {
      await apiFetch('/api/GpxLibrary/reorder', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items: items.map(i => ({ id: i.id, order: i.order })) }),
      })
    } catch (e) {
      // Revert on failure
      prev.forEach(({ id, order }) => {
        const entry = gpxLibrary.value.find(x => x.id === id)
        if (entry) entry.sortOrder = order
      })
      gpxLibrary.value.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      throw e
    }
  }

  async function capDifficulty(max: number): Promise<void> {
    await apiFetch('/api/GpxLibrary/cap-difficulty', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ maxDifficulty: max }),
    })
    gpxLibrary.value.forEach(e => {
      if (e.difficultyStars && e.difficultyStars > max) e.difficultyStars = max
    })
  }

  return { gpxLibrary, loading, error, fetchGpxLibrary, createGpxRoute, updateGpxRoute, deleteGpxRoute, reorderRoutes, toggleWishlist, capDifficulty }
})
