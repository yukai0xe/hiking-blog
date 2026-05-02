import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, uploadFile, STORAGE_BUCKETS } from '../services/supabase'
import type { Post, Photo, Gear } from '../types'

async function extractGpxDates(file: File): Promise<{ date_start: string | null; date_end: string | null }> {
  try {
    const text = await file.text()
    const xml  = new DOMParser().parseFromString(text, 'text/xml')
    const { gpx } = await import('@tmcw/togeojson')
    const geojson = gpx(xml)
    const track   = geojson.features.find(
      f => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'
    )
    const times: string[] = track?.properties?.coordTimes ?? []
    if (times.length === 0) return { date_start: null, date_end: null }
    return {
      date_start: times[0].split('T')[0],
      date_end:   times[times.length - 1].split('T')[0],
    }
  } catch {
    return { date_start: null, date_end: null }
  }
}

export const usePostStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const currentPhotos = ref<Photo[]>([])
  const currentGears = ref<Gear[]>([])
  const availableTags = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTags() {
    const { data } = await supabase.from('tags').select('name').order('name')
    availableTags.value = (data ?? []).map((t: { name: string }) => t.name)
  }

  async function createTag(name: string) {
    const trimmed = name.trim()
    if (!trimmed || availableTags.value.includes(trimmed)) return
    const { error: err } = await supabase.from('tags').insert({ name: trimmed })
    if (!err) availableTags.value = [...availableTags.value, trimmed].sort((a, b) => a.localeCompare(b, 'zh-TW'))
  }

  async function fetchPosts() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('posts')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (err) throw err
      posts.value = data ?? []
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchPostDetail(id: string) {
    loading.value = true
    error.value = null
    try {
      const [postRes, photosRes, gearsRes] = await Promise.all([
        supabase.from('posts').select('*').eq('id', id).is('deleted_at', null).single(),
        supabase.from('photos').select('*').eq('post_id', id).order('created_at'),
        supabase.from('gears').select('*').eq('post_id', id),
      ])
      if (postRes.error) throw postRes.error
      currentPost.value = postRes.data
      currentPhotos.value = photosRes.data ?? []
      currentGears.value = gearsRes.data ?? []
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
    error.value = null
    try {
      const id = crypto.randomUUID()
      const timestamp = Date.now()

      const coverExt = payload.coverFile.name.split('.').pop()
      const coverUrl = await uploadFile(STORAGE_BUCKETS.covers, `${id}-${timestamp}.${coverExt}`, payload.coverFile)

      const gpxUrl   = payload.gpxFile
        ? await uploadFile(STORAGE_BUCKETS.gpx, `${id}-${timestamp}.gpx`, payload.gpxFile)
        : ''

      const gpxDates = payload.gpxFile
        ? await extractGpxDates(payload.gpxFile)
        : { date_start: null, date_end: null }

      const { error: postErr } = await supabase.from('posts').insert({
        id,
        title:         payload.title,
        description:   payload.description,
        cover_image:   coverUrl,
        gpx_file:      gpxUrl,
        date_start:    payload.dateStart  || gpxDates.date_start,
        date_end:      payload.dateEnd    || gpxDates.date_end,
        weather:       payload.weather    || null,
        people_count:  payload.peopleCount != null ? (parseInt(String(payload.peopleCount), 10) || null) : null,
        tags:          payload.tags?.length ? payload.tags : [],
      })
      if (postErr) throw postErr

      if (payload.photoFiles.length > 0) {
        const photoUrls = await Promise.all(
          payload.photoFiles.map((f, i) =>
            uploadFile(STORAGE_BUCKETS.photos, `${id}-${timestamp}-${i}.${f.name.split('.').pop()}`, f)
          )
        )
        const { error: photoErr } = await supabase.from('photos').insert(
          photoUrls.map((url) => ({ post_id: id, url }))
        )
        if (photoErr) throw photoErr
      }

      if (payload.gears.length > 0) {
        const { error: gearErr } = await supabase.from('gears').insert(
          payload.gears.map((g) => ({ ...g, post_id: id }))
        )
        if (gearErr) throw gearErr
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
    error.value = null
    try {
      const timestamp = Date.now()
      const peopleCount = payload.peopleCount != null
        ? (parseInt(String(payload.peopleCount), 10) || null)
        : null
      const updates: Partial<Post> = {
        title:        payload.title,
        description:  payload.description,
        date_start:   payload.dateStart || null,
        date_end:     payload.dateEnd   || null,
        weather:      payload.weather   || null,
        people_count: peopleCount,
        tags:         payload.tags ?? [],
      }

      if (payload.coverFile) {
        const ext = payload.coverFile.name.split('.').pop()
        updates.cover_image = await uploadFile(
          STORAGE_BUCKETS.covers,
          `${id}-${timestamp}.${ext}`,
          payload.coverFile
        )
      }

      if (payload.gpxFile) {
        const [gpxUrl, dates] = await Promise.all([
          uploadFile(STORAGE_BUCKETS.gpx, `${id}-${timestamp}.gpx`, payload.gpxFile),
          extractGpxDates(payload.gpxFile),
        ])
        updates.gpx_file = gpxUrl
        if (payload.dateStart === undefined) updates.date_start = dates.date_start
        if (payload.dateEnd   === undefined) updates.date_end   = dates.date_end
      }

      const { error: postErr } = await supabase.from('posts').update(updates).eq('id', id)
      if (postErr) throw postErr

      if (payload.photoIdsToDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('photos').delete().in('id', payload.photoIdsToDelete)
        if (delErr) throw delErr
      }

      if (payload.photoFilesToAdd.length > 0) {
        const urls = await Promise.all(
          payload.photoFilesToAdd.map((f, i) =>
            uploadFile(
              STORAGE_BUCKETS.photos,
              `${id}-${timestamp}-add${i}.${f.name.split('.').pop()}`,
              f
            )
          )
        )
        const { error: addErr } = await supabase.from('photos').insert(
          urls.map(url => ({ post_id: id, url }))
        )
        if (addErr) throw addErr
      }

      // Refresh local state
      await fetchPostDetail(id)
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deletePhoto(photoId: string) {
    const { error: err } = await supabase.from('photos').delete().eq('id', photoId)
    if (err) throw err
    currentPhotos.value = currentPhotos.value.filter(p => p.id !== photoId)
  }

  async function deletePost(id: string) {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (err) throw err

      posts.value = posts.value.filter(p => p.id !== id)
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
