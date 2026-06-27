import { ref, computed } from 'vue'
import type { GearStatus } from '../types'

export type GearForm = {
  name: string; weight: string; note: string; category: string
  quantity: number; brand: string; referenceUrls: string[]; price: string
  addedAt: string; status: GearStatus
}

export const statusOptions: { value: GearStatus; label: string }[] = [
  { value: 'owned',    label: '已擁有' },
  { value: 'wishlist', label: '願望清單' },
  { value: 'abandon',  label: '已淘汰' },
  { value: 'other',    label: '未分組' },
]

export function useGearForm() {
  const form = ref<GearForm>({
    name: '', weight: '', note: '', category: '其他',
    quantity: 1, brand: '', referenceUrls: [''], price: '',
    addedAt: new Date().toISOString().slice(0, 10), status: 'other',
  })

  const formErrors = computed(() => {
    const e: Partial<Record<'weight' | 'price', string>> = {}
    const w = form.value.weight.trim()
    if (w !== '' && (isNaN(Number(w)) || Number(w) < 0)) e.weight = '重量需為有效數字'
    const p = form.value.price.trim()
    if (p !== '' && (isNaN(Number(p)) || Number(p) < 0)) e.price = '價格需為有效數字'
    return e
  })

  const urlErrors = computed(() =>
    form.value.referenceUrls.map(u => {
      const v = u.trim()
      return v && !/^https?:\/\//.test(v) ? '需以 http:// 或 https:// 開頭' : ''
    })
  )

  const hasFormErrors = computed(() =>
    Object.keys(formErrors.value).length > 0 || urlErrors.value.some(Boolean)
  )

  return { form, formErrors, urlErrors, hasFormErrors }
}
