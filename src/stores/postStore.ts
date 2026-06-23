import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Post, Photo, Gear, GearImage, WaypointOverride, Food, FoodDraft, FoodDayAssignment, PostGpxRecord } from '../types'
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

export const usePostStore = defineStore('posts', () => {
  const posts                    = ref<Post[]>([])
  const currentPost              = ref<Post | null>(null)
  const currentPhotos            = ref<Photo[]>([])
  const currentGears             = ref<Gear[]>([])
  const currentWaypointOverrides = ref<WaypointOverride[]>([])
  const currentFoods = ref<Food[]>([])
  const currentFoodDayAssignments = ref<FoodDayAssignment[]>([])
  const currentGpxRecords = ref<PostGpxRecord[]>([])
  const currentRecordWaypointOverrides = ref<WaypointOverride[]>([])
  const availableTags = ref<string[]>([])
  const gearLibrary      = ref<Gear[]>([])
  const gearCategories   = ref<string[]>([])
  const ownGearCategories = ref<string[]>([])
  const loading       = ref(false)
  const error         = ref<string | null>(null)

  async function fetchGearLibrary() {
    const res         = await apiFetch('/api/Gears')
    gearLibrary.value = await res.json()
  }

  async function fetchGearCategories() {
    if (gearCategories.value.length > 0) return
    const res  = await apiFetch('/api/Gears/categories')
    const data: { name: string; isOwn: boolean }[] = await res.json()
    gearCategories.value    = data.map(c => c.name)
    ownGearCategories.value = data.filter(c => c.isOwn).map(c => c.name)
  }

  async function addGearCategory(name: string) {
    await apiFetch('/api/Gears/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!gearCategories.value.includes(name)) {
      gearCategories.value = [...gearCategories.value, name].sort((a, b) =>
        a.localeCompare(b, 'zh-TW')
      )
    }
    if (!ownGearCategories.value.includes(name)) {
      ownGearCategories.value = [...ownGearCategories.value, name].sort((a, b) =>
        a.localeCompare(b, 'zh-TW')
      )
    }
  }

  async function deleteGearCategory(name: string) {
    await apiFetch(`/api/Gears/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })
    gearCategories.value    = gearCategories.value.filter(c => c !== name)
    ownGearCategories.value = ownGearCategories.value.filter(c => c !== name)
  }

  type GearPayload = {
    name: string; weight: number; note: string; category: string
    quantity: number; brand?: string | null; referenceUrl?: string | null
    price?: number | null; addedAt?: string | null; isWishlist?: boolean
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

  async function fetchGearImages(id: string): Promise<GearImage[]> {
    const res = await apiFetch(`/api/Gears/${id}/images`)
    return res.json()
  }

  async function deleteGearImage(gearId: string, imageId: string): Promise<void> {
    await apiFetch(`/api/Gears/${gearId}/images/${imageId}`, { method: 'DELETE' })
  }

  function uploadGearImageWithProgress(
    gearId: string,
    file: File,
    onProgress: (pct: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const fd  = new FormData()
      fd.append('files', file)
      const auth = useAuthStore()
      const xhr  = new XMLHttpRequest()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { onProgress(100); resolve() }
        else reject(new Error(xhr.responseText || `HTTP ${xhr.status}`))
      }
      xhr.onerror = () => reject(new Error('上傳失敗'))

      xhr.open('POST', `${API_BASE}/api/Gears/${gearId}/images`)
      if (auth.token) xhr.setRequestHeader('Authorization', `Bearer ${auth.token}`)
      xhr.send(fd)
    })
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
      currentPost.value              = data.post
      currentPhotos.value            = data.photos
      currentGears.value             = data.gears
      currentWaypointOverrides.value = data.waypointOverrides ?? []
      currentFoods.value              = data.foods ?? []
      currentFoodDayAssignments.value = data.foodDayAssignments ?? []
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
    foods?: { name: string; weight: number; quantity: number; note: string; referenceUrl?: string; price?: number | null }[]
    libraryGearIds?: string[]
    dateStart?: string
    dateEnd?: string
    weather?: string
    peopleCount?: number | null
    difficultyStars?: number | null
    tags?: string[]
    showGpx?: boolean
    showGears?: boolean
    showFoods?: boolean
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
          foods:          payload.foods ?? [],
          libraryGearIds: payload.libraryGearIds ?? [],
          dateStart:      payload.dateStart   ?? null,
          dateEnd:        payload.dateEnd     ?? null,
          weather:         payload.weather         ?? null,
          peopleCount:     payload.peopleCount     ?? null,
          difficultyStars: payload.difficultyStars ?? null,
          tags:            payload.tags            ?? [],
          showGpx:         payload.showGpx         ?? true,
          showGears:       payload.showGears        ?? true,
          showFoods:       payload.showFoods        ?? true,
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
      foods?: { id?: string; name: string; weight: number; quantity: number; note: string; referenceUrl?: string; price?: number | null }[]
      libraryGearIdsToLink?: string[]
      dateStart?: string
      dateEnd?: string
      weather?: string
      peopleCount?: number | null
      difficultyStars?: number | null
      tags?: string[]
      showGpx?: boolean
      showGears?: boolean
      showFoods?: boolean
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
          foods:                payload.foods ?? [],
          libraryGearIdsToLink: payload.libraryGearIdsToLink ?? [],
          dateStart:        payload.dateStart   ?? null,
          dateEnd:          payload.dateEnd     ?? null,
          weather:          payload.weather         ?? null,
          peopleCount:      payload.peopleCount     ?? null,
          difficultyStars:  payload.difficultyStars ?? null,
          tags:             payload.tags            ?? [],
          showGpx:          payload.showGpx         ?? true,
          showGears:        payload.showGears        ?? true,
          showFoods:        payload.showFoods        ?? true,
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

  async function saveGearsInPlace(
    postId: string,
    opts: {
      gearsToAdd:           { name: string; weight: number; note: string; category: string; quantity: number; brand: string; referenceUrl: string; price: number | null; addedAt: string }[]
      gearsToUpdate:        { id: string; name: string; weight: number; note: string; category: string; quantity: number; brand: string; referenceUrl: string; price: number | null; addedAt: string }[]
      gearIdsToDelete:      string[]
      libraryGearIdsToLink?: string[]
    }
  ) {
    const post = currentPost.value!
    await apiFetch(`/api/Posts/${postId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:                post.title,
        description:          post.description ?? '',
        photoIdsToDelete:     [],
        gearsToAdd:           opts.gearsToAdd,
        gearsToUpdate:        opts.gearsToUpdate,
        gearIdsToDelete:      opts.gearIdsToDelete,
        foods:                currentFoods.value.map(f => ({
          id: f.id, name: f.name, weight: f.weight, quantity: f.quantity,
          note: f.note, referenceUrl: f.referenceUrl, price: f.price,
        })),
        libraryGearIdsToLink: opts.libraryGearIdsToLink ?? [],
        dateStart:            post.dateStart   ?? null,
        dateEnd:              post.dateEnd     ?? null,
        weather:              post.weather         ?? null,
        peopleCount:          post.peopleCount     ?? null,
        difficultyStars:      post.difficultyStars ?? null,
        tags:                 post.tags            ?? [],
        showGpx:              post.showGpx     ?? true,
        showGears:            post.showGears   ?? true,
        showFoods:            post.showFoods   ?? true,
      }),
    })
    const res  = await apiFetch(`/api/Posts/${postId}`)
    const data = await res.json()
    currentGears.value = data.gears ?? []
  }

  async function saveFoods(postId: string, foods: FoodDraft[]) {
    await apiFetch(`/api/Posts/${postId}/foods`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ foods }),
    })
    const res  = await apiFetch(`/api/Posts/${postId}`)
    const data = await res.json()
    currentFoods.value = data.foods ?? []
  }

  async function saveFoodDayAssignments(postId: string, assignments: { foodId: string; dayIndex: number }[]) {
    await apiFetch(`/api/Posts/${postId}/food-day-assignments`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ assignments }),
    })
    currentFoodDayAssignments.value = assignments.map(a => ({
      id: '', postId, foodId: a.foodId, dayIndex: a.dayIndex,
    }))
  }

  async function fetchGpxRecords(postId: string) {
    const res = await apiFetch(`/api/Gpx/${postId}/records`)
    currentGpxRecords.value = await res.json()
  }

  async function fetchRecordWaypointOverrides(postId: string, recordId: string) {
    const res = await apiFetch(`/api/Gpx/${postId}/records/${recordId}/waypoints`)
    currentRecordWaypointOverrides.value = await res.json()
  }

  async function createGpxRecord(postId: string, name: string, gpxFile: File): Promise<string> {
    const fd = new FormData()
    fd.append('name', name)
    fd.append('gpxFile', gpxFile)
    const res = await apiFetch(`/api/Gpx/${postId}/records`, { method: 'POST', body: fd })
    const data = await res.json()
    await fetchGpxRecords(postId)
    return data.id as string
  }

  async function createGpxRecordFromUrl(postId: string, name: string, url: string): Promise<string> {
    const res = await apiFetch(`/api/Gpx/${postId}/records/link`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, url }),
    })
    const data = await res.json()
    await fetchGpxRecords(postId)
    return data.id as string
  }

  async function linkGpxRecord(postId: string, recordId: string, url: string): Promise<void> {
    await apiFetch(`/api/Gpx/${postId}/records/${recordId}/link`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url }),
    })
    const rec = currentGpxRecords.value.find(r => r.id === recordId)
    if (rec) rec.gpxFileUrl = url
  }

  async function rerouteGpxRecord(postId: string, recordId: string, gpxFile: File): Promise<string> {
    const fd = new FormData()
    fd.append('gpxFile', gpxFile)
    await apiFetch(`/api/Gpx/${postId}/records/${recordId}/file`, { method: 'POST', body: fd })
    await fetchGpxRecords(postId)
    const rec = currentGpxRecords.value.find(r => r.id === recordId)
    return rec?.gpxFileUrl ?? ''
  }

  async function renameGpxRecord(postId: string, recordId: string, name: string) {
    await apiFetch(`/api/Gpx/${postId}/records/${recordId}/name`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    })
    const rec = currentGpxRecords.value.find(r => r.id === recordId)
    if (rec) rec.name = name
  }

  async function updateGpxRecordDescription(postId: string, recordId: string, description: string) {
    await apiFetch(`/api/Gpx/${postId}/records/${recordId}/description`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ description }),
    })
    const rec = currentGpxRecords.value.find(r => r.id === recordId)
    if (rec) rec.description = description
  }

  async function updateMainRouteDescription(postId: string, description: string) {
    await apiFetch(`/api/Gpx/${postId}/description`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ description }),
    })
    if (currentPost.value) currentPost.value.gpxDescription = description
  }

  async function deleteGpxRecord(postId: string, recordId: string) {
    await apiFetch(`/api/Gpx/${postId}/records/${recordId}`, { method: 'DELETE' })
    currentGpxRecords.value = currentGpxRecords.value.filter(r => r.id !== recordId)
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

  async function updatePostVisibility(postId: string, isPublic: boolean): Promise<void> {
    await apiFetch(`/api/Posts/${postId}/visibility`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isPublic }),
    })
    if (currentPost.value?.id === postId) {
      currentPost.value = { ...currentPost.value, isPublic }
    }
  }

  async function capDifficulty(max: number) {
    await apiFetch('/api/Posts/cap-difficulty', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ maxDifficulty: max }),
    })
    posts.value.forEach(p => {
      if (p.difficultyStars && p.difficultyStars > max) p.difficultyStars = max
    })
    if (currentPost.value?.difficultyStars && currentPost.value.difficultyStars > max)
      currentPost.value = { ...currentPost.value, difficultyStars: max }
  }

  return {
    posts,
    currentPost,
    currentPhotos,
    currentGears,
    currentWaypointOverrides,
    currentFoods,
    currentFoodDayAssignments,
    saveGearsInPlace,
    saveFoods,
    saveFoodDayAssignments,
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
    addGearCategory,
    deleteGearCategory,
    gearCategories,
    ownGearCategories,
    createLibraryGear,
    updateLibraryGear,
    deleteLibraryGear,
    fetchGearImages,
    deleteGearImage,
    uploadGearImageWithProgress,
    currentGpxRecords,
    currentRecordWaypointOverrides,
    fetchGpxRecords,
    fetchRecordWaypointOverrides,
    createGpxRecord,
    createGpxRecordFromUrl,
    linkGpxRecord,
    rerouteGpxRecord,
    renameGpxRecord,
    updateGpxRecordDescription,
    updateMainRouteDescription,
    deleteGpxRecord,
    updatePostVisibility,
    capDifficulty,
  }
})
