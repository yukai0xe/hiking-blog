<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 px-4">

      <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <button
            class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
            @click="$router.back()" aria-label="返回"
          >
            <ArrowLeftIcon :size="17" />
          </button>
          <div>
            <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">Edit Entry</p>
            <h1 class="font-heading text-xl font-bold text-ink">編輯記錄</h1>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="delete-btn flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold font-body cursor-pointer transition-all duration-200"
            :disabled="store.loading"
            @click="confirmingDelete = true"
          >
            <Trash2Icon :size="15" />
            刪除
          </button>
          <button
            class="btn-cta flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold font-body cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="store.loading || !form.title.trim()"
            @click="save"
          >
            <span v-if="store.loading" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent" />
            <SaveIcon v-else :size="15" />
            {{ store.loading ? '儲存中…' : '儲存' }}
          </button>
        </div>
      </div>

      <!-- Save error banner -->
      <div
        v-if="store.error && !confirmingDelete"
        class="mb-4 px-4 py-2.5 rounded-lg flex items-center gap-2 font-body text-sm"
        style="background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.35); color: #e07070;"
      >
        <AlertCircleIcon :size="14" class="shrink-0" />
        {{ store.error }}
      </div>
      </div>

      <!-- Modals -->
      <CropModal v-if="showCropper" :src="cropSrc" @confirm="onCropConfirm" @cancel="showCropper = false" />

      <Teleport to="body">
        <Transition name="modal">
          <div v-if="confirmingDelete" class="modal-backdrop" @click.self="confirmingDelete = false">
            <div class="modal-box">
              <div class="modal-icon-wrap"><Trash2Icon :size="26" /></div>
              <h2 class="font-heading text-xl font-bold text-ink mb-1">刪除這筆記錄？</h2>
              <p class="font-body text-sm text-inkMuted leading-relaxed mb-6">
                「{{ store.currentPost?.title }}」將永久刪除，包含所有照片與裝備資料，無法復原。
              </p>
              <p v-if="store.error" class="text-red-400 text-xs font-body mb-4 flex items-center gap-1">
                <AlertCircleIcon :size="13" /> {{ store.error }}
              </p>
              <div class="flex gap-3">
                <button
                  class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors duration-200"
                  :disabled="store.loading"
                  @click="confirmingDelete = false"
                >取消</button>
                <button
                  class="flex-1 py-2.5 rounded-lg font-semibold font-body text-sm cursor-pointer delete-confirm-btn flex items-center justify-center gap-1.5 transition-all duration-200"
                  :disabled="store.loading"
                  @click="handleDelete"
                >
                  <span v-if="store.loading" class="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
                  <Trash2Icon v-else :size="13" />
                  {{ store.loading ? '刪除中…' : '確認刪除' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Loading -->
      <div v-if="pageLoading" class="max-w-2xl mx-auto card-aged p-10 text-center text-inkMuted font-body">
        <div class="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
        載入中…
      </div>

      <template v-else>

        <!-- Step indicator -->
        <div class="max-w-2xl mx-auto">
          <div class="flex items-center mb-6 card-aged p-4">
            <template v-for="(label, i) in stepLabels" :key="i">
              <div class="flex flex-col items-center gap-1 cursor-pointer" @click="step = i + 1">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200"
                  :class="
                    step > i + 1   ? 'bg-secondary text-ink opacity-80' :
                    step === i + 1 ? 'bg-primary text-[var(--c-cta-text)] shadow-md' :
                                     'bg-border/40 text-inkMuted hover:bg-border/70'
                  "
                >
                  <CheckIcon v-if="step > i + 1" :size="14" />
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span
                  class="text-[10px] tracking-wide hidden sm:block font-body"
                  :class="
                    step === i + 1 ? 'text-primary' :
                    step > i + 1   ? 'text-inkMuted' :
                                     'text-inkMuted opacity-40'
                  "
                >{{ label }}</span>
              </div>
              <div v-if="i < stepLabels.length - 1"
                class="flex-1 h-px mx-2 transition-colors duration-300"
                :class="step > i + 1 ? 'bg-secondary opacity-60' : 'bg-border opacity-40'"
              />
            </template>
          </div>
        </div>

        <div class="max-w-2xl mx-auto">
        <div class="card-aged p-6">

          <!-- Step 1: 基本資訊 -->
          <div v-if="step === 1" class="space-y-5">
            <h2 class="font-heading text-xl text-ink mb-4">基本資訊</h2>
            <div>
              <label class="field-label">標題 *</label>
              <input v-model="form.title" type="text" class="input-field" placeholder="這次登山的名稱" />
            </div>
            <div>
              <label class="field-label">標籤</label>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in form.tags" :key="tag"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-body border"
                  style="background: color-mix(in srgb, var(--c-primary) 28%, transparent); border-color: var(--c-primary); color: var(--c-ink); font-weight: 600;"
                >
                  <button type="button" class="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" @click="form.tags.splice(form.tags.indexOf(tag), 1)">
                    <XIcon :size="11" />
                  </button>
                  {{ tag }}
                </span>
                <button
                  type="button"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body cursor-pointer transition-all duration-150 border border-dashed"
                  style="color: var(--c-inkMuted); border-color: color-mix(in srgb, var(--c-border) 80%, transparent);"
                  @click="tagModalOpen = true"
                >
                  <TagIcon :size="12" /> 選擇標籤
                </button>
              </div>
              <TagPickerModal :open="tagModalOpen" v-model="form.tags" @close="tagModalOpen = false" />
            </div>
            <div>
              <label class="field-label">描述</label>
              <textarea v-model="form.description" rows="4" class="input-field resize-none" placeholder="記錄這次登山的心得…" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label">開始日期</label>
                <input v-model="form.dateStart" type="date" class="input-field font-mono text-sm" />
              </div>
              <div>
                <label class="field-label">結束日期</label>
                <input v-model="form.dateEnd" type="date" class="input-field font-mono text-sm" />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label">天氣</label>
                <select v-model="form.weather" class="input-field font-body">
                  <option value="">— 選擇天氣 —</option>
                  <option>晴天</option><option>多雲時晴</option><option>多雲</option>
                  <option>陰天</option><option>小雨</option><option>雨天</option>
                  <option>大雨</option><option>雷陣雨</option><option>起霧</option><option>下雪</option>
                </select>
              </div>
              <div>
                <label class="field-label">人數</label>
                <input v-model.number="form.peopleCount" type="number" min="1" max="999" class="input-field no-spinner" placeholder="隊員人數" />
              </div>
            </div>
            <div>
              <label class="field-label">難度</label>
              <div class="flex items-center gap-2 mt-1">
                <button
                  v-for="n in profile.difficultyMax" :key="n"
                  type="button"
                  class="text-xl leading-none transition-colors duration-100 cursor-pointer"
                  :class="n <= (form.difficultyStars ?? 0) ? 'text-primary' : 'text-inkMuted opacity-30'"
                  @click="form.difficultyStars = form.difficultyStars === n ? null : n"
                >★</button>
                <span v-if="form.difficultyStars && profile.difficultyLabels[form.difficultyStars - 1]"
                  class="text-xs font-body text-inkMuted ml-1">
                  {{ profile.difficultyLabels[form.difficultyStars - 1] }}
                </span>
              </div>
            </div>
          </div>

          <!-- Step 2: 封面 -->
          <div v-else-if="step === 2" class="space-y-4">
            <h2 class="font-heading text-xl text-ink mb-4">封面圖片</h2>
            <div
              class="relative overflow-hidden cursor-pointer group/cover border-2 border-dashed rounded-xl transition-all duration-200"
              :class="coverPreview ? 'border-primary/50' : 'border-border/40 hover:border-primary/40'"
              @click="coverInput?.click()"
            >
              <img
                :src="coverPreview ?? store.currentPost?.coverImage"
                alt="封面"
                class="w-full h-auto block transition-all duration-300 group-hover/cover:brightness-75"
              />
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200">
                <div class="flex items-center gap-2 bg-base/80 text-ink px-4 py-2 rounded-lg text-sm font-body font-medium">
                  <ImageIcon :size="15" /> 更換封面
                </div>
              </div>
              <div v-if="coverPreview" class="absolute top-2 right-2 bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-2 py-0.5 rounded">
                NEW
              </div>
            </div>
            <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverChange" />
          </div>

          <!-- Step 3: 照片 -->
          <div v-else-if="step === 3" class="space-y-4">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-heading text-xl text-ink">照片集</h2>
              <button
                class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-3 py-1.5 rounded-lg cursor-pointer"
                @click="photosInput?.click()"
              >
                <PlusIcon :size="13" /> 新增照片
              </button>
            </div>
            <input ref="photosInput" type="file" accept="image/*" multiple class="hidden" @change="onAddPhotos" />

            <div v-if="visiblePhotos.length > 0 || newPhotoPreviews.length > 0" class="grid grid-cols-3 gap-2">
              <div v-for="photo in visiblePhotos" :key="photo.id"
                class="relative aspect-square overflow-hidden rounded-lg group/photo">
                <img :src="photo.url" class="w-full h-full object-cover opacity-90" alt="" />
                <button
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-base/80 text-inkMuted hover:text-red-400 hover:bg-base flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all duration-150 cursor-pointer"
                  @click="markDelete(photo.id)"
                ><XIcon :size="12" /></button>
              </div>
              <div v-for="(src, i) in newPhotoPreviews" :key="`new-${i}`"
                class="relative aspect-square overflow-hidden rounded-lg group/photo">
                <img :src="src" class="w-full h-full object-cover opacity-90" alt="" />
                <div class="absolute top-1 left-1 bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-1.5 py-0.5 rounded">NEW</div>
                <button
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-base/80 text-inkMuted hover:text-red-400 hover:bg-base flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all duration-150 cursor-pointer"
                  @click="removeNewPhoto(i)"
                ><XIcon :size="12" /></button>
              </div>
            </div>
            <div v-else class="text-center text-inkMuted text-sm font-body italic py-8">
              — 尚無照片，點擊「新增照片」上傳 —
            </div>

            <div v-if="pendingDeletes.length > 0" class="mt-2 pt-4 border-t border-border/40">
              <p class="text-xs text-inkMuted font-body mb-2 flex items-center gap-1">
                <AlertCircleIcon :size="12" /> 以下照片將於儲存時刪除（點擊可復原）
              </p>
              <div class="flex gap-2 flex-wrap">
                <div v-for="photo in deletedPhotos" :key="photo.id"
                  class="relative w-16 h-16 overflow-hidden rounded-lg cursor-pointer opacity-40 hover:opacity-70 transition-opacity"
                  @click="undoDelete(photo.id)">
                  <img :src="photo.url" class="w-full h-full object-cover" alt="" />
                  <div class="absolute inset-0 flex items-center justify-center bg-base/60">
                    <RotateCcwIcon :size="14" class="text-ink" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: 詳細資訊 -->
          <div v-else-if="step === 4" class="space-y-4">
            <h2 class="font-heading text-xl text-ink mb-1">詳細資訊</h2>
            <p class="text-inkMuted text-sm font-body mb-6">選擇在詳細頁要顯示的區塊，關閉後資料仍保留。</p>

            <div class="space-y-3">
              <!-- GPX 路線 toggle -->
              <div
                class="flex items-center justify-between p-4 rounded-xl"
                style="border: 1px solid var(--c-border); background: color-mix(in srgb, var(--c-card) 50%, transparent);"
              >
                <div>
                  <p class="text-sm font-body font-semibold text-ink">GPX 路線</p>
                  <p class="text-xs font-body text-inkMuted mt-0.5">在詳細頁顯示地圖與記錄點</p>
                </div>
                <button
                  type="button"
                  class="toggle-btn shrink-0"
                  :class="form.showGpx ? 'toggle-on' : 'toggle-off'"
                  @click="form.showGpx = !form.showGpx"
                >
                  <span class="toggle-thumb" :class="form.showGpx ? 'translate-x-5' : 'translate-x-0'" />
                </button>
              </div>

              <!-- 裝備清單 toggle -->
              <div
                class="flex items-center justify-between p-4 rounded-xl"
                style="border: 1px solid var(--c-border); background: color-mix(in srgb, var(--c-card) 50%, transparent);"
              >
                <div>
                  <p class="text-sm font-body font-semibold text-ink">裝備清單</p>
                  <p class="text-xs font-body text-inkMuted mt-0.5">在詳細頁顯示裝備列表與重量統計</p>
                </div>
                <button
                  type="button"
                  class="toggle-btn shrink-0"
                  :class="form.showGears ? 'toggle-on' : 'toggle-off'"
                  @click="form.showGears = !form.showGears"
                >
                  <span class="toggle-thumb" :class="form.showGears ? 'translate-x-5' : 'translate-x-0'" />
                </button>
              </div>

              <!-- 糧食清單 toggle -->
              <div
                class="flex items-center justify-between p-4 rounded-xl"
                style="border: 1px solid var(--c-border); background: color-mix(in srgb, var(--c-card) 50%, transparent);"
              >
                <div>
                  <p class="text-sm font-body font-semibold text-ink">糧食清單</p>
                  <p class="text-xs font-body text-inkMuted mt-0.5">在詳細頁顯示糧食規劃</p>
                </div>
                <button
                  type="button"
                  class="toggle-btn shrink-0"
                  :class="form.showFoods ? 'toggle-on' : 'toggle-off'"
                  @click="form.showFoods = !form.showFoods"
                >
                  <span class="toggle-thumb" :class="form.showFoods ? 'translate-x-5' : 'translate-x-0'" />
                </button>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex justify-between mt-8 pt-6 border-t border-border/40">
            <button v-if="step > 1"
              class="flex items-center gap-1.5 px-5 py-2.5 rounded-lg card-aged text-inkMuted font-body font-medium cursor-pointer hover:text-ink transition-colors duration-200"
              @click="step--">
              <ArrowLeftIcon :size="14" /> 上一步
            </button>
            <div v-else />
            <button v-if="step < TOTAL_STEPS"
              class="btn-cta flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold font-body cursor-pointer"
              @click="step++">
              下一步 <ArrowRightIcon :size="14" />
            </button>
            <button v-else
              class="btn-cta flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold font-body cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="store.loading || !form.title.trim()" @click="save">
              <span v-if="store.loading" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent" />
              <SaveIcon v-else :size="15" />
              {{ store.loading ? '儲存中…' : '儲存' }}
            </button>
          </div>

        </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  Save as SaveIcon, Check as CheckIcon,
  Plus as PlusIcon, X as XIcon, Tag as TagIcon,
  Image as ImageIcon,
  AlertCircle as AlertCircleIcon,
  RotateCcw as RotateCcwIcon,
  Trash2 as Trash2Icon,
} from 'lucide-vue-next'
import type { Photo } from '../types'
import { usePostStore } from '../stores/postStore'
import { useProfileStore } from '../stores/profileStore'
import CropModal from '../components/CropModal.vue'
import TagPickerModal from '../components/TagPickerModal.vue'

const profile = useProfileStore()

const route  = useRoute()
const router = useRouter()
const store  = usePostStore()
const id = route.params.id as string

const TOTAL_STEPS = 4
const stepLabels  = ['基本', '封面', '照片', '詳細資訊']

// UI state
const step             = ref(1)
const pageLoading      = ref(true)
const confirmingDelete = ref(false)
const tagModalOpen     = ref(false)
const showCropper      = ref(false)
const cropSrc          = ref('')

// File refs
const coverInput  = ref<HTMLInputElement | null>(null)
const photosInput = ref<HTMLInputElement | null>(null)

// New file state
const newCoverFile     = ref<File | null>(null)
const coverPreview     = ref<string | null>(null)
const newPhotoFiles    = ref<File[]>([])
const newPhotoPreviews = ref<string[]>([])

// Photo delete state
const pendingDeletes = ref<string[]>([])

// Form
const form = ref({
  title:       '',
  description: '',
  dateStart:   '',
  dateEnd:     '',
  weather:         '',
  peopleCount:     null as number | null,
  difficultyStars: null as number | null,
  tags:            [] as string[],
  showGpx:     true,
  showGears:   true,
  showFoods:   true,
})

const visiblePhotos = computed<Photo[]>(() =>
  store.currentPhotos.filter(p => !pendingDeletes.value.includes(p.id))
)
const deletedPhotos = computed<Photo[]>(() =>
  store.currentPhotos.filter(p => pendingDeletes.value.includes(p.id))
)

function toDateInput(val: string | null | undefined) {
  return val ? val.slice(0, 10) : ''
}

onMounted(async () => {
  await store.fetchPostDetail(id)
  if (store.currentPost) {
    const p = store.currentPost
    form.value.title       = p.title
    form.value.description = p.description ?? ''
    form.value.dateStart   = toDateInput(p.dateStart)
    form.value.dateEnd     = toDateInput(p.dateEnd)
    form.value.weather         = p.weather         ?? ''
    form.value.peopleCount     = p.peopleCount     ?? null
    form.value.difficultyStars = p.difficultyStars ?? null
    form.value.tags            = p.tags?.length ? [...p.tags] : []
    form.value.showGpx     = p.showGpx  !== false
    form.value.showGears   = p.showGears !== false
    form.value.showFoods   = p.showFoods !== false
  }
  pageLoading.value = false
})

// Cover
function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value    = URL.createObjectURL(file)
  showCropper.value = true
}
function onCropConfirm(file: File) {
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  newCoverFile.value  = file
  coverPreview.value  = URL.createObjectURL(file)
  showCropper.value   = false
}

// Photos
function onAddPhotos(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  newPhotoFiles.value.push(...files)
  newPhotoPreviews.value.push(...files.map(f => URL.createObjectURL(f)))
  ;(e.target as HTMLInputElement).value = ''
}
function removeNewPhoto(i: number) {
  URL.revokeObjectURL(newPhotoPreviews.value[i])
  newPhotoFiles.value.splice(i, 1)
  newPhotoPreviews.value.splice(i, 1)
}
function markDelete(photoId: string) { pendingDeletes.value.push(photoId) }
function undoDelete(photoId: string) { pendingDeletes.value = pendingDeletes.value.filter(x => x !== photoId) }

// Delete post
async function handleDelete() {
  try {
    await store.deletePost(id)
    router.replace('/')
  } catch { /* error shown via store.error */ }
}

// Save — preserves existing gears/foods by passing them through unchanged
async function save() {
  try {
    await store.updatePost(id, {
      title:            form.value.title,
      description:      form.value.description,
      coverFile:        newCoverFile.value,
      gpxFile:          null,
      photoFilesToAdd:  newPhotoFiles.value,
      photoIdsToDelete: pendingDeletes.value,
      gearsToAdd:           [],
      libraryGearIdsToLink: [],
      gearsToUpdate:    [],
      gearIdsToDelete:  [],
      dateStart:        form.value.dateStart  || undefined,
      dateEnd:          form.value.dateEnd    || undefined,
      weather:          form.value.weather         || undefined,
      peopleCount:      form.value.peopleCount,
      difficultyStars:  form.value.difficultyStars,
      tags:             form.value.tags,
      foods:            store.currentFoods.map(f => ({
        id:           f.id,
        name:         f.name,
        weight:       f.weight,
        quantity:     f.quantity,
        note:         f.note,
        referenceUrl: f.referenceUrl ?? '',
        price:        f.price ?? null,
      })),
      showGpx:          form.value.showGpx,
      showGears:        form.value.showGears,
      showFoods:        form.value.showFoods,
    })
    router.push(`/detail/${id}`)
  } catch { /* error shown via store.error */ }
}
</script>

<style scoped>
.field-label {
  display: block;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

/* Remove number spinners */
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }

/* ── Delete button ──────────────────────────────────── */
.delete-btn {
  background: rgba(220, 60, 60, 0.1);
  color: #e07070;
  border: 1px solid rgba(220, 60, 60, 0.35);
}
.delete-btn:hover:not(:disabled) {
  background: rgba(220, 60, 60, 0.2);
  border-color: rgba(220, 60, 60, 0.6);
  color: #f08080;
}
.delete-confirm-btn {
  background: rgba(220, 60, 60, 0.15);
  color: #e07070;
  border: 1px solid rgba(220, 60, 60, 0.4);
}
.delete-confirm-btn:hover:not(:disabled) {
  background: rgba(220, 60, 60, 0.28);
  border-color: rgba(220, 60, 60, 0.65);
}

/* ── Toggle switch ───────────────────────────────────── */
.toggle-btn {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease;
}
.toggle-on  { background: var(--c-primary); }
.toggle-off { background: color-mix(in srgb, var(--c-border) 120%, transparent); }
.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s ease;
  display: block;
}

/* ── Delete modal ───────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(10, 9, 8, 0.72);
  backdrop-filter: blur(4px);
}
.modal-box {
  width: 100%;
  max-width: 380px;
  border-radius: 16px;
  padding: 32px 28px 28px;
  background: var(--c-card);
  border: 1px solid rgba(220, 60, 60, 0.25);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
  text-align: center;
}
.modal-icon-wrap {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(220, 60, 60, 0.12);
  border: 1px solid rgba(220, 60, 60, 0.3);
  color: #e07070;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease, transform 0.12s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }
</style>
