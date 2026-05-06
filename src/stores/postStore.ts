import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Post, Photo, Gear } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

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
  const loading       = ref(false)
  const error         = ref<string | null>(null)

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
    description: string
    coverFile: File
    gpxFile: File | null
    photoFiles: File[]
    gears: { name: string; weight: number; note: string }[]
    dateStart?: string
    dateEnd?: string
    weather?: string
    peopleCount?: number | null
    tags?: string[]
  }) {
    loading.value = true
    error.value   = null
    try {
      const form = new FormData()
      form.append('title',       payload.title)
      form.append('description', payload.description)
      form.append('coverFile',   payload.coverFile)
      if (payload.gpxFile) form.append('gpxFile', payload.gpxFile)
      payload.photoFiles.forEach(f => form.append('photoFiles', f))
      payload.gears.forEach((g, i) => {
        form.append(`gears[${i}].name`,   g.name)
        form.append(`gears[${i}].weight`, String(g.weight))
        form.append(`gears[${i}].note`,   g.note)
      })
      if (payload.dateStart)          form.append('dateStart',   payload.dateStart)
      if (payload.dateEnd)            form.append('dateEnd',     payload.dateEnd)
      if (payload.weather)            form.append('weather',     payload.weather)
      if (payload.peopleCount != null) form.append('peopleCount', String(payload.peopleCount))
      payload.tags?.forEach(t => form.append('tags', t))

      const res  = await apiFetch('/api/Posts', { method: 'POST', body: form })
      const data = await res.json()
      return data.id as string
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
      description: string
      coverFile: File | null
      gpxFile: File | null
      photoFilesToAdd: File[]
      photoIdsToDelete: string[]
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
      const form = new FormData()
      form.append('title',       payload.title)
      form.append('description', payload.description)
      if (payload.coverFile) form.append('coverFile', payload.coverFile)
      if (payload.gpxFile)   form.append('gpxFile',   payload.gpxFile)
      payload.photoFilesToAdd.forEach(f => form.append('photoFilesToAdd', f))
      payload.photoIdsToDelete.forEach(id => form.append('photoIdsToDelete', id))
      if (payload.dateStart)           form.append('dateStart',   payload.dateStart)
      if (payload.dateEnd)             form.append('dateEnd',     payload.dateEnd)
      if (payload.weather)             form.append('weather',     payload.weather)
      if (payload.peopleCount != null) form.append('peopleCount', String(payload.peopleCount))
      payload.tags?.forEach(t => form.append('tags', t))

      await apiFetch(`/api/Posts/${id}`, { method: 'PUT', body: form })
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
  }
})
