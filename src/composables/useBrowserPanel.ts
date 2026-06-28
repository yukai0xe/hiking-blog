import { ref } from 'vue'

const browserOpen = ref(false)

export function useBrowserPanel() {
  return { browserOpen }
}
