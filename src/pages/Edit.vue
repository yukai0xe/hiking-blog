<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 max-w-2xl mx-auto px-4">

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
          <!-- 刪除按鈕 -->
          <button
            class="delete-btn flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold font-body cursor-pointer transition-all duration-200"
            :disabled="store.loading"
            @click="confirmingDelete = true"
          >
            <Trash2Icon :size="15" />
            刪除
          </button>

          <!-- 儲存 -->
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

      <!-- 裁剪 Modal -->
      <CropModal
        v-if="showCropper"
        :src="cropSrc"
        @confirm="onCropConfirm"
        @cancel="onCropCancel"
      />

      <!-- 刪除確認 Modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="confirmingDelete"
            class="modal-backdrop"
            @click.self="confirmingDelete = false"
          >
            <div class="modal-box">
              <!-- Icon -->
              <div class="modal-icon-wrap">
                <Trash2Icon :size="26" />
              </div>

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
                >
                  取消
                </button>
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

      <div v-if="pageLoading" class="card-aged p-10 text-center text-inkMuted font-body">
        <div class="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
        載入中…
      </div>

      <template v-else>

        <!-- ① 基本資訊 -->
        <section class="card-aged p-6 mb-4">
          <h2 class="section-label">基本資訊</h2>
          <div class="space-y-4">
            <div>
              <label class="field-label">標題 *</label>
              <input v-model="form.title" type="text" class="input-field" placeholder="這次登山的名稱" />
            </div>
            <div>
              <label class="field-label">標籤</label>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in form.tags"
                  :key="tag"
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
            </div>

            <TagPickerModal
              :open="tagModalOpen"
              v-model="form.tags"
              @close="tagModalOpen = false"
            />
          </div>
        </section>

        <!-- ② GPX 路線 -->
        <section class="card-aged p-6 mb-4">
          <h2 class="section-label">GPX 路線</h2>
          <div class="flex items-center gap-3 mb-5">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-body text-inkMuted uppercase tracking-widest mb-1">目前檔案</p>
              <p class="font-mono text-sm text-ink truncate">
                {{ newGpxFile ? newGpxFile.name : currentGpxFilename }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span v-if="newGpxFile" class="bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-2 py-0.5 rounded">NEW</span>
              <button
                class="flex items-center gap-1.5 text-sm text-primary font-semibold font-body cursor-pointer hover:opacity-70 transition-opacity"
                @click="gpxInput?.click()"
              >
                <RefreshCwIcon :size="13" /> 重新上傳
              </button>
            </div>
          </div>
          <input ref="gpxInput" type="file" accept=".gpx" class="hidden" @change="onGpxChange" />

          <div class="border-t border-border/30 pt-5 space-y-4">
            <!-- 描述 -->
            <div>
              <label class="field-label">描述</label>
              <textarea v-model="form.description" rows="4" class="input-field resize-none" placeholder="記錄這次登山的心得…" />
            </div>

            <!-- 日期 -->
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

            <!-- 天氣 + 人數 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label">天氣</label>
                <select v-model="form.weather" class="input-field font-body">
                  <option value="">— 選擇天氣 —</option>
                  <option>晴天</option>
                  <option>多雲時晴</option>
                  <option>多雲</option>
                  <option>陰天</option>
                  <option>小雨</option>
                  <option>雨天</option>
                  <option>大雨</option>
                  <option>雷陣雨</option>
                  <option>起霧</option>
                  <option>下雪</option>
                </select>
              </div>
              <div>
                <label class="field-label">人數</label>
                <input v-model.number="form.peopleCount" type="number" min="1" max="999" class="input-field" placeholder="隊員人數" />
              </div>
            </div>
          </div>
        </section>

        <!-- ④ 封面圖片 -->
        <section class="card-aged p-6 mb-4">
          <h2 class="section-label">封面圖片</h2>

          <!-- Current / new preview -->
          <div class="relative rounded-xl overflow-hidden mb-3 cursor-pointer group/cover" @click="coverInput?.click()">
            <img
              :src="coverPreview ?? store.currentPost?.cover_image"
              alt="封面"
              class="w-full max-h-56 object-cover transition-all duration-300 group-hover/cover:brightness-75"
            />
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200">
              <div class="flex items-center gap-2 bg-base/80 text-ink px-4 py-2 rounded-lg text-sm font-body font-medium">
                <ImageIcon :size="15" />
                更換封面
              </div>
            </div>
            <div v-if="coverPreview" class="absolute top-2 right-2 bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-2 py-0.5 rounded">
              NEW
            </div>
          </div>
          <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverChange" />

          <button
            class="flex items-center gap-1.5 text-sm text-primary font-semibold font-body cursor-pointer hover:opacity-70 transition-opacity"
            @click="coverInput?.click()"
          >
            <RefreshCwIcon :size="13" /> 更換封面圖片
          </button>
        </section>

        <!-- ⑤ 照片管理 -->
        <section class="card-aged p-6 mb-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="section-label mb-0">照片集</h2>
            <button
              class="flex items-center gap-1.5 btn-cta text-xs font-semibold font-body px-3 py-1.5 rounded-lg cursor-pointer"
              @click="photosInput?.click()"
            >
              <PlusIcon :size="13" /> 新增照片
            </button>
          </div>
          <input ref="photosInput" type="file" accept="image/*" multiple class="hidden" @change="onAddPhotos" />

          <!-- Existing photos -->
          <div v-if="visiblePhotos.length > 0 || newPhotoPreviews.length > 0" class="grid grid-cols-3 gap-2">

            <!-- Existing (not deleted) -->
            <div
              v-for="photo in visiblePhotos"
              :key="photo.id"
              class="relative aspect-square overflow-hidden rounded-lg group/photo"
            >
              <img :src="photo.url" class="w-full h-full object-cover opacity-90" alt="" />
              <button
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-base/80 text-inkMuted hover:text-red-400 hover:bg-base flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all duration-150 cursor-pointer"
                @click="markDelete(photo.id)"
                :aria-label="`刪除照片`"
              >
                <XIcon :size="12" />
              </button>
            </div>

            <!-- New photos to upload -->
            <div
              v-for="(src, i) in newPhotoPreviews"
              :key="`new-${i}`"
              class="relative aspect-square overflow-hidden rounded-lg group/photo"
            >
              <img :src="src" class="w-full h-full object-cover opacity-90" alt="" />
              <div class="absolute top-1 left-1 bg-primary text-[var(--c-cta-text)] text-[10px] font-mono px-1.5 py-0.5 rounded">NEW</div>
              <button
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-base/80 text-inkMuted hover:text-red-400 hover:bg-base flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all duration-150 cursor-pointer"
                @click="removeNewPhoto(i)"
                aria-label="取消新增"
              >
                <XIcon :size="12" />
              </button>
            </div>

          </div>
          <div v-else class="text-center text-inkMuted text-sm font-body italic py-8">
            — 尚無照片，點擊「新增照片」上傳 —
          </div>

          <!-- Deleted preview -->
          <div v-if="pendingDeletes.length > 0" class="mt-4 pt-4 border-t border-border/40">
            <p class="text-xs text-inkMuted font-body mb-2 flex items-center gap-1">
              <AlertCircleIcon :size="12" />
              以下照片將於儲存時刪除（點擊可復原）
            </p>
            <div class="flex gap-2 flex-wrap">
              <div
                v-for="photo in deletedPhotos"
                :key="photo.id"
                class="relative w-16 h-16 overflow-hidden rounded-lg cursor-pointer opacity-40 hover:opacity-70 transition-opacity"
                @click="undoDelete(photo.id)"
              >
                <img :src="photo.url" class="w-full h-full object-cover" alt="" />
                <div class="absolute inset-0 flex items-center justify-center bg-base/60">
                  <RotateCcwIcon :size="14" class="text-ink" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <p v-if="store.error" class="text-red-400 text-sm flex items-center gap-1 font-body mt-2">
          <AlertCircleIcon :size="14" /> {{ store.error }}
        </p>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon,
  Save as SaveIcon,
  Plus as PlusIcon, X as XIcon, Tag as TagIcon,
  Image as ImageIcon,
  RefreshCw as RefreshCwIcon,
  AlertCircle as AlertCircleIcon,
  RotateCcw as RotateCcwIcon,
  Trash2 as Trash2Icon,
} from 'lucide-vue-next'
import { usePostStore } from '../stores/postStore'
import CropModal from '../components/CropModal.vue'
import TagPickerModal from '../components/TagPickerModal.vue'
import type { Photo } from '../types'

const route  = useRoute()
const router = useRouter()
const store  = usePostStore()

const id = route.params.id as string

const pageLoading       = ref(true)
const confirmingDelete  = ref(false)
const tagModalOpen      = ref(false)
const showCropper       = ref(false)
const cropSrc           = ref('')
const coverInput      = ref<HTMLInputElement | null>(null)
const gpxInput        = ref<HTMLInputElement | null>(null)
const photosInput     = ref<HTMLInputElement | null>(null)
const coverPreview    = ref<string | null>(null)
const newCoverFile    = ref<File | null>(null)
const newGpxFile      = ref<File | null>(null)
const newPhotoFiles   = ref<File[]>([])
const newPhotoPreviews = ref<string[]>([])
const pendingDeletes  = ref<string[]>([])


const form = ref({
  title:       '',
  description: '',
  dateStart:   '',
  dateEnd:     '',
  weather:     '',
  peopleCount: null as number | null,
  tags:        [] as string[],
})


const currentGpxFilename = computed(() => {
  const url = store.currentPost?.gpx_file ?? ''
  return decodeURIComponent(url.split('/').pop() ?? '').replace(/^[^-]+-\d+-/, '') || 'route.gpx'
})

// Photos still visible (not pending delete)
const visiblePhotos = computed<Photo[]>(() =>
  store.currentPhotos.filter(p => !pendingDeletes.value.includes(p.id))
)
// Photos marked for deletion (shown in undo area)
const deletedPhotos = computed<Photo[]>(() =>
  store.currentPhotos.filter(p => pendingDeletes.value.includes(p.id))
)

function toDateInput(val: string | null | undefined): string {
  if (!val) return ''
  return val.slice(0, 10)   // always "YYYY-MM-DD"
}

onMounted(async () => {
  await store.fetchPostDetail(id)
  if (store.currentPost) {
    const p = store.currentPost
    form.value.title       = p.title
    form.value.description = p.description ?? ''
    form.value.dateStart   = toDateInput(p.date_start)
    form.value.dateEnd     = toDateInput(p.date_end)
    form.value.weather     = p.weather     ?? ''
    form.value.peopleCount = p.people_count ?? null
    form.value.tags        = p.tags?.length ? [...p.tags] : []
  }
  pageLoading.value = false
})

function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value   = URL.createObjectURL(file)
  showCropper.value = true
}

function onCropConfirm(file: File) {
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  newCoverFile.value  = file
  coverPreview.value  = URL.createObjectURL(file)
  showCropper.value   = false
}

function onCropCancel() {
  showCropper.value = false
}

function onGpxChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  newGpxFile.value = file
  ;(e.target as HTMLInputElement).value = ''
}

function onAddPhotos(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  newPhotoFiles.value.push(...files)
  newPhotoPreviews.value.push(...files.map(f => URL.createObjectURL(f)))
  // reset input so same files can be re-selected
  ;(e.target as HTMLInputElement).value = ''
}

function removeNewPhoto(i: number) {
  URL.revokeObjectURL(newPhotoPreviews.value[i])
  newPhotoFiles.value.splice(i, 1)
  newPhotoPreviews.value.splice(i, 1)
}

function markDelete(photoId: string) {
  pendingDeletes.value.push(photoId)
}

function undoDelete(photoId: string) {
  pendingDeletes.value = pendingDeletes.value.filter(id => id !== photoId)
}

async function handleDelete() {
  try {
    await store.deletePost(id)
    router.replace('/')
  } catch { /* error shown via store.error */ }
}

async function save() {
  try {
    await store.updatePost(id, {
      title:            form.value.title,
      description:      form.value.description,
      coverFile:        newCoverFile.value,
      gpxFile:          newGpxFile.value,
      photoFilesToAdd:  newPhotoFiles.value,
      photoIdsToDelete: pendingDeletes.value,
      dateStart:        form.value.dateStart  || undefined,
      dateEnd:          form.value.dateEnd    || undefined,
      weather:          form.value.weather    || undefined,
      peopleCount:      form.value.peopleCount,
      tags:             form.value.tags,
    })
    router.push(`/detail/${id}`)
  } catch { /* error shown via store.error */ }
}
</script>

<style scoped>
.section-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 17px;
  font-weight: 600;
  color: var(--c-ink);
  letter-spacing: 0.04em;
  margin-bottom: 16px;
}
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
/* ── Delete button (header) ─────────────────────────── */
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

/* ── Modal confirm button ───────────────────────────── */
.delete-confirm-btn {
  background: rgba(220, 60, 60, 0.15);
  color: #e07070;
  border: 1px solid rgba(220, 60, 60, 0.4);
}
.delete-confirm-btn:hover:not(:disabled) {
  background: rgba(220, 60, 60, 0.28);
  border-color: rgba(220, 60, 60, 0.65);
}

/* ── Delete confirm modal ───────────────────────────── */
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
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(220, 60, 60, 0.12);
  border: 1px solid rgba(220, 60, 60, 0.3);
  color: #e07070;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

/* ── Modal transition ───────────────────────────────── */
.modal-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease, transform 0.12s ease; }
.modal-enter-from   { opacity: 0; transform: scale(0.96); }
.modal-leave-to     { opacity: 0; transform: scale(0.96); }
</style>
