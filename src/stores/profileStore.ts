import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './authStore'
import { usePostStore } from './postStore'
import { useGpxLibraryStore } from './gpxLibraryStore'

export type ThemeMode = 'dark' | 'light' | 'auto'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const DEFAULT_LABELS = ['輕鬆健行', '一般登山', '中等難度', '具挑戰性', '極度困難']

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const auth    = useAuthStore()
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> ?? {}) }
  if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) throw new Error(await res.text())
  return res
}

function loadFromStorage() {
  let themeMode: ThemeMode = 'dark'
  // Migrate old 'theme' key
  const stored = localStorage.getItem('themeMode') as ThemeMode | null
  if (stored) themeMode = stored
  else if (localStorage.getItem('theme') === 'light') themeMode = 'light'

  const difficultyMax = Math.max(1, parseInt(localStorage.getItem('difficultyMax') ?? '5', 10) || 5)

  let difficultyLabels: string[] = [...DEFAULT_LABELS]
  try {
    const parsed = JSON.parse(localStorage.getItem('difficultyLabels') ?? 'null')
    if (Array.isArray(parsed)) difficultyLabels = parsed as string[]
  } catch { /* use defaults */ }

  return { themeMode, difficultyMax, difficultyLabels }
}

export const useProfileStore = defineStore('profile', () => {
  const initial = loadFromStorage()

  const themeMode          = ref<ThemeMode>(initial.themeMode)
  const difficultyMax      = ref<number>(initial.difficultyMax)
  const difficultyLabels   = ref<string[]>(initial.difficultyLabels)
  const discordWebhookUrl  = ref<string>('')

  const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    systemDark.value = e.matches
    if (themeMode.value === 'auto') applyTheme()
  })

  const isDark = computed(() => {
    if (themeMode.value === 'auto') return systemDark.value
    return themeMode.value === 'dark'
  })

  function applyTheme() {
    document.documentElement.classList.toggle('light', !isDark.value)
  }

  function ensureLabels(max: number) {
    while (difficultyLabels.value.length < max) difficultyLabels.value.push('')
  }

  // Debounced save
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(saveToApi, 800)
  }

  function persistLocal() {
    localStorage.setItem('themeMode', themeMode.value)
    localStorage.setItem('difficultyMax', String(difficultyMax.value))
    localStorage.setItem('difficultyLabels', JSON.stringify(difficultyLabels.value))
  }

  async function saveToApi() {
    const auth = useAuthStore()
    if (!auth.token) return
    try {
      await apiFetch('/api/UserProfile', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          themeMode:         themeMode.value,
          difficultyMax:     difficultyMax.value,
          difficultyLabels:  difficultyLabels.value,
          discordWebhookUrl: discordWebhookUrl.value || null,
        }),
      })
    } catch { /* localStorage already persisted — API failure is non-fatal */ }
  }

  async function fetchFromApi() {
    const auth = useAuthStore()
    if (!auth.token) return
    try {
      const res  = await apiFetch('/api/UserProfile')
      const data = await res.json() as {
        themeMode: string; difficultyMax: number; difficultyLabels: string[]; discordWebhookUrl?: string | null
      }
      if (data.themeMode && ['dark','light','auto'].includes(data.themeMode))
        themeMode.value = data.themeMode as ThemeMode
      if (typeof data.difficultyMax === 'number' && data.difficultyMax >= 1)
        difficultyMax.value = data.difficultyMax
      if (Array.isArray(data.difficultyLabels))
        difficultyLabels.value = data.difficultyLabels
      discordWebhookUrl.value = data.discordWebhookUrl ?? ''
      applyTheme()
      persistLocal()
    } catch { /* use localStorage values */ }
  }

  function setThemeMode(m: ThemeMode) {
    themeMode.value = m
    applyTheme()
    persistLocal()
    scheduleSave()
  }

  function setDifficultyMax(max: number) {
    const clamped = Math.max(1, max)
    const wasHigher = clamped < difficultyMax.value
    difficultyMax.value = clamped
    ensureLabels(difficultyMax.value)
    persistLocal()
    scheduleSave()
    if (wasHigher) {
      usePostStore().capDifficulty(clamped).catch(() => {})
      useGpxLibraryStore().capDifficulty(clamped).catch(() => {})
    }
  }

  function setDifficultyLabel(index: number, label: string) {
    const arr = [...difficultyLabels.value]
    while (arr.length <= index) arr.push('')
    arr[index] = label
    difficultyLabels.value = arr
    persistLocal()
    scheduleSave()
  }

  function setDiscordWebhookUrl(url: string) {
    discordWebhookUrl.value = url
    scheduleSave()
  }

  async function testDiscordWebhook(): Promise<void> {
    await apiFetch('/api/UserProfile/test-discord', { method: 'POST' })
  }

  applyTheme()

  return {
    themeMode, isDark, difficultyMax, difficultyLabels, discordWebhookUrl,
    setThemeMode, setDifficultyMax, setDifficultyLabel, setDiscordWebhookUrl,
    testDiscordWebhook, fetchFromApi,
  }
})
