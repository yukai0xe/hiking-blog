import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Post, Photo, Gear } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) throw new Error(await res.text())
  return res
}

export const usePostStore = defineStore('posts', () => {
  const posts         = ref<Post[]>([])
  const currentPost   = ref<Post | null>(null)
  const currentPhotos = ref<Photo[]>([])
  const currentGears  = ref<Gear[]>([])
  const availableTags = ref<string[]>([])
  const gearLibrary      = ref<Gear[]>([])
  const gearCategories   = ref<string[]>([])
  const loading       = ref(false)
  const error         = ref<string | null>(null)

  async function fetchGearLibrary() {
    const res         = await apiFetch('/api/Gears')
    gearLibrary.value = await res.json()
  }

  async function fetchGearCategories() {
    if (gearCategories.value.length > 0) return
    const res            = await apiFetch('/api/Gears/categories')
    gearCategories.value = await res.json()
  }

  type GearPayload = {
    name: string; weight: number; note: string; category: string
    quantity: number; brand?: string | null; referenceUrl?: string | null
    price?: number | null; addedAt?: string | null
  }

  async function createLibraryGear(payload: GearPayload): Promise<string> {
    const res  = await apiFetch('/api/Gears', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    await fetchGearLibrary()
    return data.id as string
  }

  async function updateLibraryGear(id: string, payload: GearPayload): Promise<void> {
    await apiFetch(`/api/Gears/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    await fetchGearLibrary()
  }

  async function deleteLibraryGear(id: string): Promise<void> {
    await apiFetch(`/api/Gears/${id}`, { method: 'DELETE' })
    gearLibrary.value = gearLibrary.value.filter(g => g.id !== id)
  }

  async function fetchTags() {
    const res           = await apiFetch('/api/Tags')
    availableTags.value = await res.json()
  }

  async function createTag(name: string) {
    const trimmed = name.trim()
    if (!trimmed || availableTags.value.includes(trimmed)) return
    await apiFetch('/api/Tags', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: trimmed }),
    })
    availableTags.value = [...availableTags.value, trimmed].sort((a, b) => a.localeCompare(b, 'zh-TW'))
  }

  async function fetchPosts() {
    loading.value = true
    error.value   = null
    try {
      const res   = await apiFetch('/api/Posts')
      posts.value = await res.json()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchPostDetail(id: string) {
    loading.value = true
    error.value   = null
    try {
      const res  = await apiFetch(`/api/Posts/${id}`)
      const data = await res.json()
      currentPost.value   = data.post
      currentPhotos.value = data.photos
      currentGears.value  = data.gears
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createPost(payload: {
    title: string
    description?: string
    coverFile: File
    gpxFile: File | null
    photoFiles: File[]
    gears: { name: string; weight: number; note: string; category: string; quantity: number; brand?: string; referenceUrl?: string; price?: number | null; addedAt?: string }[]
    libraryGearIds?: string[]
    dateStart?: string
    dateEnd?: string
    weather?: string
    peopleCount?: number | null
    tags?: string[]
  }) {
    loading.value = true
    error.value   = null
    try {
      // ① Send metadata as JSON
      const res  = await apiFetch('/api/Posts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:          payload.title,
          description:    payload.description ?? '',
          gears:          payload.gears,
          libraryGearIds: payload.libraryGearIds ?? [],
          dateStart:      payload.dateStart   ?? null,
          dateEnd:        payload.dateEnd     ?? null,
          weather:        payload.weather     ?? null,
          peopleCount:    payload.peopleCount ?? null,
          tags:           payload.tags        ?? [],
        }),
      })
      const data = await res.json()
      const id   = data.id as string

      // ② Upload files
      const coverFd = new FormData()
      coverFd.append('coverFile', payload.coverFile)
      await apiFetch(`/api/Photos/${id}/cover`, { method: 'POST', body: coverFd })

      if (payload.gpxFile) {
        const gpxFd = new FormData()
        gpxFd.append('gpxFile', payload.gpxFile)
        await apiFetch(`/api/Gpx/${id}`, { method: 'POST', body: gpxFd })
      }

      if (payload.photoFiles.length > 0) {
        const photoFd = new FormData()
        payload.photoFiles.forEach(f => photoFd.append('photos', f))
        await apiFetch(`/api/Photos/${id}/photos`, { method: 'POST', body: photoFd })
      }

      return id
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePost(
    id: string,
    payload: {
      title: string
      description?: string
      coverFile: File | null
      gpxFile: File | null
      photoFilesToAdd: File[]
      photoIdsToDelete: string[]
      gearsToAdd: { name: string; weight: number; note: string; category: string; quantity: number; brand?: string; referenceUrl?: string; price?: number | null; addedAt?: string }[]
      gearsToUpdate: { id: string; name: string; weight: number; note: string; category: string; quantity: number; brand?: string; referenceUrl?: string; price?: number | null; addedAt?: string }[]
      gearIdsToDelete: string[]
      libraryGearIdsToLink?: string[]
      dateStart?: string
      dateEnd?: string
      weather?: string
      peopleCount?: number | null
      tags?: string[]
    }
  ) {
    loading.value = true
    error.value   = null
    try {
      // ① Upload files first (FormData, each to its own endpoint)
      if (payload.coverFile) {
        const fd = new FormData()
        fd.append('coverFile', payload.coverFile)
        await apiFetch(`/api/Photos/${id}/cover`, { method: 'POST', body: fd })
      }
      if (payload.gpxFile) {
        const fd = new FormData()
        fd.append('gpxFile', payload.gpxFile)
        await apiFetch(`/api/Gpx/${id}`, { method: 'POST', body: fd })
      }
      if (payload.photoFilesToAdd.length > 0) {
        const fd = new FormData()
        payload.photoFilesToAdd.forEach(f => fd.append('photos', f))
        await apiFetch(`/api/Photos/${id}/photos`, { method: 'POST', body: fd })
      }

      // ② Send metadata as JSON
      await apiFetch(`/api/Posts/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            payload.title,
          description:      payload.description ?? '',
          photoIdsToDelete: payload.photoIdsToDelete,
          gearsToAdd:           payload.gearsToAdd,
          gearsToUpdate:        payload.gearsToUpdate,
          gearIdsToDelete:      payload.gearIdsToDelete,
          libraryGearIdsToLink: payload.libraryGearIdsToLink ?? [],
          dateStart:        payload.dateStart   ?? null,
          dateEnd:          payload.dateEnd     ?? null,
          weather:          payload.weather     ?? null,
          peopleCount:      payload.peopleCount ?? null,
          tags:             payload.tags        ?? [],
        }),
      })

      await fetchPostDetail(id)
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deletePhoto(photoId: string) {
    await apiFetch(`/api/Photos/${photoId}`, { method: 'DELETE' })
    currentPhotos.value = currentPhotos.value.filter(p => p.id !== photoId)
  }

  async function deletePost(id: string) {
    loading.value = true
    error.value   = null
    try {
      await apiFetch(`/api/Posts/${id}`, { method: 'DELETE' })
      posts.value       = posts.value.filter(p => p.id !== id)
      currentPost.value = null
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    posts,
    currentPost,
    currentPhotos,
    currentGears,
    availableTags,
    gearLibrary,
    loading,
    error,
    fetchTags,
    createTag,
    fetchPosts,
    fetchPostDetail,
    createPost,
    updatePost,
    deletePhoto,
    deletePost,
    fetchGearLibrary,
    fetchGearCategories,
    gearCategories,
    createLibraryGear,
    updateLibraryGear,
    deleteLibraryGear,
  }
})
