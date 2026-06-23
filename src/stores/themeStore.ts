import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useProfileStore, type ThemeMode } from './profileStore'

export type { ThemeMode }

export const useThemeStore = defineStore('theme', () => {
  const profile = useProfileStore()
  const isDark  = computed(() => profile.isDark)
  const mode    = computed(() => profile.themeMode)
  function toggle()              { profile.setThemeMode(profile.isDark ? 'light' : 'dark') }
  function setMode(m: ThemeMode) { profile.setThemeMode(m) }
  return { isDark, mode, toggle, setMode }
})
