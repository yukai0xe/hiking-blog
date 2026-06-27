import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { NoteGroup, NoteLink } from '../types'
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

export const useNotesStore = defineStore('notes', () => {
  const groups     = ref<NoteGroup[]>([])
  const links      = ref<NoteLink[]>([])
  const trashLinks = ref<NoteLink[]>([])
  const loading    = ref(false)
  const error      = ref<string | null>(null)

  async function fetchNotes() {
    loading.value = true
    error.value   = null
    try {
      const res  = await apiFetch('/api/notes')
      const data = await res.json() as { groups: NoteGroup[]; links: NoteLink[] }
      groups.value = data.groups
      links.value  = data.links
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createGroup(name: string, description?: string): Promise<void> {
    const res     = await apiFetch('/api/notes/groups', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, description: description ?? null }),
    })
    const created = await res.json() as NoteGroup
    groups.value.push(created)
  }

  async function updateGroup(id: string, name: string, description?: string): Promise<void> {
    const idx  = groups.value.findIndex(g => g.id === id)
    if (idx === -1) return
    const prev = { ...groups.value[idx] }
    groups.value[idx] = { ...groups.value[idx], name, description: description ?? null }
    try {
      await apiFetch(`/api/notes/groups/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, description: description ?? null }),
      })
    } catch (e) {
      groups.value[idx] = prev
      throw e
    }
  }

  async function deleteGroup(id: string): Promise<void> {
    const prevGroups = groups.value.slice()
    const prevLinks  = links.value.map(l => ({ ...l }))
    groups.value     = groups.value.filter(g => g.id !== id)
    links.value.forEach(l => { if (l.groupId === id) l.groupId = null })
    try {
      await apiFetch(`/api/notes/groups/${id}`, { method: 'DELETE' })
    } catch (e) {
      groups.value = prevGroups
      links.value  = prevLinks
      throw e
    }
  }

  async function addLink(
    url: string,
    title: string,
    coverImageUrl: string | null,
    groupId: string | null,
  ): Promise<void> {
    const res     = await apiFetch('/api/notes/links', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url, title, coverImageUrl, groupId }),
    })
    const created = await res.json() as NoteLink
    links.value.push(created)
  }

  async function moveLink(id: string, groupId: string | null): Promise<void> {
    const idx = links.value.findIndex(l => l.id === id)
    if (idx === -1) return
    const prev = { ...links.value[idx] }
    if (prev.groupId === groupId) return
    links.value[idx] = { ...links.value[idx], groupId }
    try {
      await apiFetch(`/api/notes/links/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ groupId }),
      })
    } catch (e) {
      links.value[idx] = prev
      throw e
    }
  }

  async function deleteLink(id: string): Promise<void> {
    const prev   = links.value.slice()
    links.value  = links.value.filter(l => l.id !== id)
    try {
      await apiFetch(`/api/notes/links/${id}`, { method: 'DELETE' })
    } catch (e) {
      links.value = prev
      throw e
    }
  }

  async function fetchTrash(): Promise<void> {
    const res        = await apiFetch('/api/notes/trash')
    trashLinks.value = await res.json() as NoteLink[]
  }

  async function restoreLink(id: string): Promise<void> {
    trashLinks.value = trashLinks.value.filter(l => l.id !== id)
    try {
      await apiFetch(`/api/notes/links/${id}/restore`, { method: 'POST' })
      await fetchNotes()
    } catch (e) {
      await fetchTrash()
      throw e
    }
  }

  async function permanentDeleteLink(id: string): Promise<void> {
    const prev       = trashLinks.value.slice()
    trashLinks.value = trashLinks.value.filter(l => l.id !== id)
    try {
      await apiFetch(`/api/notes/trash/${id}`, { method: 'DELETE' })
    } catch (e) {
      trashLinks.value = prev
      throw e
    }
  }

  async function emptyTrash(): Promise<void> {
    const prev       = trashLinks.value.slice()
    trashLinks.value = []
    try {
      await apiFetch('/api/notes/trash', { method: 'DELETE' })
    } catch (e) {
      trashLinks.value = prev
      throw e
    }
  }

  async function fetchPreview(url: string): Promise<{ title: string; coverImageUrl: string | null }> {
    const res  = await apiFetch(`/api/notes/preview?url=${encodeURIComponent(url)}`)
    return res.json()
  }

  return { groups, links, trashLinks, loading, error, fetchNotes, createGroup, updateGroup, deleteGroup, addLink, moveLink, deleteLink, fetchTrash, restoreLink, permanentDeleteLink, emptyTrash, fetchPreview }
})
