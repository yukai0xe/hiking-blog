import { defineStore } from 'pinia'
import { ref } from 'vue'

const DEFAULT_LABELS = ['輕鬆健行', '一般登山', '中等難度', '具挑戰性', '極度困難']

export const useProfileStore = defineStore('profile', () => {
  const difficultyMax = ref<number>(
    Math.min(5, Math.max(1, parseInt(localStorage.getItem('difficultyMax') ?? '5', 10)))
  )

  function loadLabels(): string[] {
    try {
      const stored = JSON.parse(localStorage.getItem('difficultyLabels') ?? 'null')
      if (Array.isArray(stored) && stored.length === 5) return stored as string[]
    } catch { /* ignore */ }
    return [...DEFAULT_LABELS]
  }
  const difficultyLabels = ref<string[]>(loadLabels())

  function setDifficultyMax(max: number) {
    difficultyMax.value = Math.min(5, Math.max(1, max))
    localStorage.setItem('difficultyMax', String(difficultyMax.value))
  }

  function setDifficultyLabel(index: number, label: string) {
    const arr = [...difficultyLabels.value]
    arr[index] = label
    difficultyLabels.value = arr
    localStorage.setItem('difficultyLabels', JSON.stringify(arr))
  }

  return { difficultyMax, difficultyLabels, setDifficultyMax, setDifficultyLabel }
})
