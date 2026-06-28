<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 max-w-3xl mx-auto px-4">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-8">
        <button
          class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors"
          @click="$router.push('/gear-library')" aria-label="返回"
        >
          <ArrowLeftIcon :size="17" />
        </button>
        <div class="flex-1">
          <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">Gear Library</p>
          <h1 class="font-heading text-xl font-bold text-ink">{{ isNew ? '新增裝備' : '編輯裝備' }}</h1>
        </div>
        <button
          class="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-body font-semibold btn-cta cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!form.name.trim() || hasFormErrors || saving"
          @click="submitForm"
        >
          <span v-if="saving" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
          <SaveIcon v-else :size="14" />
          {{ saving ? '儲存中…' : '儲存' }}
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="card-aged p-16 text-center text-inkMuted font-body">
        <div class="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
        載入中…
      </div>

      <!-- Not found (edit mode only) -->
      <div v-else-if="!isNew && !gear" class="card-aged p-16 text-center">
        <p class="font-heading text-xl text-ink mb-2">找不到裝備</p>
        <button class="text-sm font-body text-primary hover:opacity-70 cursor-pointer" @click="$router.push('/gear-library')">返回裝備庫</button>
      </div>

      <template v-else-if="isNew || gear">
        <!-- Error banner -->
        <div v-if="apiError" class="mb-5 px-4 py-2.5 rounded-lg flex items-center gap-2 font-body text-sm"
          style="background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.35); color: #e07070;">
          <AlertCircleIcon :size="14" class="shrink-0" />{{ apiError }}
        </div>

        <!-- ── Basic fields ──────────────────────────────── -->
        <div class="card-aged px-4 sm:px-6 py-5 mb-5 space-y-4">
          <p class="section-label">基本資訊</p>

          <!-- Name + Category -->
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
            <div>
              <label class="field-label">名稱 *</label>
              <input v-model="form.name" type="text" class="input-field text-sm" placeholder="裝備名稱" />
            </div>
            <div>
              <label class="field-label">類別</label>
              <GearCategorySelect
                v-model="form.category"
                :categories="filterCategories"
                :add-category="addCategory"
              />
            </div>
          </div>

          <!-- Brand / Price / Weight / Quantity -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="col-span-2 sm:col-span-1">
              <label class="field-label">品牌</label>
              <GearBrandCombobox v-model="form.brand" :existing-brands="existingBrands" />
            </div>
            <div>
              <label class="field-label">價格</label>
              <input v-model="form.price" type="text" inputmode="numeric" class="input-field text-sm font-mono" placeholder="0"
                :style="formErrors.price ? { borderColor: '#ef4444' } : {}" />
              <p v-if="formErrors.price" class="mt-1 text-xs font-body" style="color:#ef4444;">{{ formErrors.price }}</p>
            </div>
            <div>
              <label class="field-label">重量 (g)</label>
              <input v-model="form.weight" type="text" inputmode="numeric" class="input-field text-sm font-mono" placeholder="0"
                :style="formErrors.weight ? { borderColor: '#ef4444' } : {}" />
              <p v-if="formErrors.weight" class="mt-1 text-xs font-body" style="color:#ef4444;">{{ formErrors.weight }}</p>
            </div>
            <div>
              <label class="field-label">數量</label>
              <input v-model.number="form.quantity" type="number" min="1" class="input-field text-sm font-mono no-spinner" placeholder="1" />
            </div>
          </div>

          <!-- Date + Reference URLs -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="field-label">加入時間</label>
              <input v-model="form.addedAt" type="date" class="input-field text-sm font-mono" />
            </div>
            <div class="sm:col-span-2">
              <label class="field-label">參考連結</label>
              <div class="space-y-2">
                <div v-for="(url, i) in form.referenceUrls" :key="i" class="flex gap-1.5">
                  <input
                    :value="url"
                    @input="form.referenceUrls[i] = ($event.target as HTMLInputElement).value"
                    type="url"
                    class="input-field text-sm font-mono flex-1"
                    placeholder="https://…"
                    :style="urlErrors[i] ? { borderColor: '#ef4444' } : {}"
                  />
                  <button
                    type="button"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-inkMuted hover:text-red-400 transition-colors cursor-pointer shrink-0"
                    style="border: 1px solid var(--c-border);"
                    @click="form.referenceUrls.splice(i, 1)"
                    aria-label="移除"
                  >
                    <XIcon :size="13" />
                  </button>
                </div>
                <p v-for="(err, i) in urlErrors" :key="'e'+i" class="text-xs font-body" style="color:#ef4444;">{{ err }}</p>
                <button
                  type="button"
                  class="flex items-center gap-1.5 text-xs font-body cursor-pointer transition-colors"
                  style="color: var(--c-primary);"
                  @click="form.referenceUrls.push('')"
                >
                  <PlusIcon :size="12" /> 新增連結
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="field-label">備註（短）</label>
            <input v-model="form.note" type="text" class="input-field text-sm" placeholder="簡短備註" />
          </div>

          <div>
            <label class="field-label">狀態</label>
            <GearStatusSelector v-model="form.status" />
          </div>
        </div>

        <!-- ── Description (rich text) ──────────────────── -->
        <div class="card-aged px-4 sm:px-6 py-5 mb-5">
          <p class="section-label mb-3">詳細說明</p>
          <GearRichEditor v-model="description" />
        </div>

        <!-- ── Images ────────────────────────────────────── -->
        <div class="card-aged px-4 sm:px-6 py-5 mb-8">
          <p class="section-label mb-3">圖片</p>
          <GearImageUploader
            ref="imageUploaderRef"
            :gear-id="isNew ? null : gearId"
            :saving="saving"
          />
        </div>

        <!-- Bottom save / cancel -->
        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mb-12">
          <button
            class="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors text-center"
            @click="$router.push('/gear-library')"
          >取消</button>
          <button
            class="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-body font-semibold btn-cta cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="!form.name.trim() || hasFormErrors || saving"
            @click="submitForm"
          >
            <span v-if="saving" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
            <SaveIcon v-else :size="14" />
            {{ saving ? '儲存中…' : '儲存裝備' }}
          </button>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon, Save as SaveIcon, X as XIcon, Plus as PlusIcon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next'
import type { Gear } from '../types'
import { usePostStore } from '../stores/postStore'
import { useGearForm } from '../composables/useGearForm'
import GearStatusSelector from '../components/GearStatusSelector.vue'
import GearBrandCombobox from '../components/GearBrandCombobox.vue'
import GearCategorySelect from '../components/GearCategorySelect.vue'
import GearRichEditor from '../components/GearRichEditor.vue'
import GearImageUploader from '../components/GearImageUploader.vue'

const route  = useRoute()
const router = useRouter()
const store  = usePostStore()

const gearId = route.params.id as string
const isNew  = gearId === 'new'

const loading  = ref(true)
const gear     = ref<Gear | null>(null)
const apiError = ref<string | null>(null)
const saving   = ref(false)

const { form, formErrors, urlErrors, hasFormErrors } = useGearForm()
const description = ref('')

const imageUploaderRef = ref<InstanceType<typeof GearImageUploader> | null>(null)

const filterCategories = computed(() => {
  const all = new Set([
    ...store.gearCategories,
    ...store.gearLibrary.map(g => g.category).filter(Boolean),
  ])
  return [...all].sort((a, b) => a.localeCompare(b, 'zh-TW'))
})

const existingBrands = computed(() => {
  const brands = store.gearLibrary.map(g => g.brand).filter(Boolean) as string[]
  return [...new Set(brands)].sort((a, b) => a.localeCompare(b, 'zh-TW'))
})

async function addCategory(name: string) {
  await store.addGearCategory(name)
}

onMounted(async () => {
  await Promise.all([store.fetchGearLibrary(), store.fetchGearCategories()])
  if (isNew) { loading.value = false; return }
  const found = store.gearLibrary.find(g => g.id === gearId) ?? null
  gear.value = found
  if (found) {
    form.value = {
      name:          found.name,
      weight:        found.weight != null ? String(found.weight) : '',
      note:          found.note ?? '',
      category:      found.category,
      quantity:      found.quantity ?? 1,
      brand:         found.brand ?? '',
      referenceUrls: found.referenceUrl ? found.referenceUrl.split('\n').filter(Boolean) : [''],
      price:         found.price != null ? String(found.price) : '',
      addedAt:       found.addedAt ?? '',
      status:        found.status ?? (found.isWishlist ? 'wishlist' : 'owned'),
    }
    description.value = found.description ?? ''
  }
  loading.value = false
})

async function submitForm() {
  if (!form.value.name.trim() || hasFormErrors.value) return
  saving.value   = true
  apiError.value = null
  try {
    const payload = {
      name:         form.value.name.trim(),
      weight:       form.value.weight.trim() ? Number(form.value.weight) : 0,
      note:         form.value.note,
      category:     form.value.category,
      quantity:     form.value.quantity ?? 1,
      brand:        form.value.brand || null,
      referenceUrl: form.value.referenceUrls.map(u => u.trim()).filter(Boolean).join('\n') || null,
      price:        form.value.price.trim() ? Number(form.value.price) : null,
      addedAt:      form.value.addedAt || null,
      status:       form.value.status,
      isWishlist:   form.value.status === 'wishlist',
      description:  description.value || null,
    }
    const targetId = isNew
      ? await store.createLibraryGear(payload)
      : gearId
    if (!isNew) await store.updateLibraryGear(gearId, payload)

    const deletedIds = imageUploaderRef.value!.getDeletedIds()
    const newFiles   = imageUploaderRef.value!.getNewFiles()
    const progress   = imageUploaderRef.value!.getProgress()

    for (const imgId of deletedIds) {
      await store.deleteGearImage(targetId, imgId)
    }
    for (let i = 0; i < newFiles.length; i++) {
      await store.uploadGearImageWithProgress(targetId, newFiles[i], (pct) => {
        progress.value[i] = pct
      })
    }
    router.push('/gear-library')
  } catch (e) {
    apiError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.section-label {
  font-size: 10px; font-family: Inter, sans-serif; font-weight: 700;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--c-inkMuted);
}
.field-label {
  display: block; font-size: 11px; font-family: Inter, sans-serif; font-weight: 600;
  color: var(--c-inkMuted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 5px;
}
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }
</style>
