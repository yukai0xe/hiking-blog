import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'dark' | 'light' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  // Migrate old 'theme' key → 'themeMode'
  function resolveInitialMode(): ThemeMode {
    const stored = localStorage.getItem('themeMode') as ThemeMode | null
    if (stored) return stored
    // Legacy key
    const legacy = localStorage.getItem('theme')
    if (legacy === 'light') return 'light'
    return 'dark'
  }

  const mode      = ref<ThemeMode>(resolveInitialMode())
  const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    systemDark.value = e.matches
    if (mode.value === 'auto') apply()
  })

  const isDark = computed(() => {
    if (mode.value === 'auto') return systemDark.value
    return mode.value === 'dark'
  })

  function apply() {
    document.documentElement.classList.toggle('light', !isDark.value)
  }

  function setMode(m: ThemeMode) {
    mode.value = m
    localStorage.setItem('themeMode', m)
    apply()
  }

  // Kept for the existing navbar toggle button
  function toggle() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  apply()

  return { isDark, mode, toggle, setMode }
})
