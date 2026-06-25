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
          <h1 class="font-heading text-xl font-bold text-ink">編輯裝備</h1>
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

      <!-- Not found -->
      <div v-else-if="!gear" class="card-aged p-16 text-center">
        <p class="font-heading text-xl text-ink mb-2">找不到裝備</p>
        <button class="text-sm font-body text-primary hover:opacity-70 cursor-pointer" @click="$router.push('/gear-library')">返回裝備庫</button>
      </div>

      <template v-else>
        <!-- Error banner -->
        <div v-if="apiError" class="mb-5 px-4 py-2.5 rounded-lg flex items-center gap-2 font-body text-sm"
          style="background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.35); color: #e07070;">
          <AlertCircleIcon :size="14" class="shrink-0" />{{ apiError }}
        </div>

        <!-- ── Basic fields ──────────────────────────────── -->
        <div class="card-aged px-6 py-5 mb-5 space-y-4">
          <p class="section-label">基本資訊</p>

          <div class="grid grid-cols-[1fr_160px] gap-3">
            <div>
              <label class="field-label">名稱 *</label>
              <input v-model="form.name" type="text" class="input-field text-sm" placeholder="裝備名稱" />
            </div>
            <div>
              <label class="field-label">類別</label>
              <select v-model="form.category" class="input-field text-sm font-body">
                <option v-for="cat in filterCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="field-label">品牌</label>
              <input v-model="form.brand" type="text" class="input-field text-sm" placeholder="品牌" />
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

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label">加入時間</label>
              <input v-model="form.addedAt" type="date" class="input-field text-sm font-mono" />
            </div>
            <div>
              <label class="field-label">參考連結</label>
              <input v-model="form.referenceUrl" type="text" class="input-field text-sm font-mono" placeholder="https://…"
                :style="formErrors.referenceUrl ? { borderColor: '#ef4444' } : {}" />
              <p v-if="formErrors.referenceUrl" class="mt-1 text-xs font-body" style="color:#ef4444;">{{ formErrors.referenceUrl }}</p>
            </div>
          </div>

          <div>
            <label class="field-label">備註（短）</label>
            <input v-model="form.note" type="text" class="input-field text-sm" placeholder="簡短備註" />
          </div>

          <!-- 狀態 -->
          <div>
            <label class="field-label">狀態</label>
            <div class="flex gap-2 flex-wrap mt-1">
              <button
                v-for="s in statusOptions" :key="s.value"
                type="button"
                class="status-btn"
                :class="[`status-btn--${s.value}`, { 'status-btn--active': form.status === s.value }]"
                @click="form.status = s.value"
              >{{ s.label }}</button>
            </div>
          </div>
        </div>

        <!-- ── Description (rich text) ──────────────────── -->
        <div class="card-aged px-6 py-5 mb-5">
          <p class="section-label mb-3">詳細說明</p>

          <!-- Toolbar -->
          <div class="editor-toolbar">
            <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('bold') }" @click="editor?.chain().focus().toggleBold().run()" title="粗體"><BoldIcon :size="14" /></button>
            <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('italic') }" @click="editor?.chain().focus().toggleItalic().run()" title="斜體"><ItalicIcon :size="14" /></button>
            <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('strike') }" @click="editor?.chain().focus().toggleStrike().run()" title="刪除線"><StrikethroughIcon :size="14" /></button>
            <div class="tb-divider" />
            <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('heading', { level: 2 }) }" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()" title="標題">H2</button>
            <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('heading', { level: 3 }) }" @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()" title="小標題">H3</button>
            <div class="tb-divider" />
            <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('bulletList') }" @click="editor?.chain().focus().toggleBulletList().run()" title="項目清單"><ListIcon :size="14" /></button>
            <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('orderedList') }" @click="editor?.chain().focus().toggleOrderedList().run()" title="有序清單"><ListOrderedIcon :size="14" /></button>
            <div class="tb-divider" />
            <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('blockquote') }" @click="editor?.chain().focus().toggleBlockquote().run()" title="引用"><QuoteIcon :size="14" /></button>
            <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('code') }" @click="editor?.chain().focus().toggleCode().run()" title="行內代碼"><CodeIcon :size="14" /></button>
            <div class="tb-divider" />
            <button type="button" class="tb-btn" @click="editor?.chain().focus().undo().run()" title="復原"><Undo2Icon :size="14" /></button>
            <button type="button" class="tb-btn" @click="editor?.chain().focus().redo().run()" title="取消復原"><Redo2Icon :size="14" /></button>
          </div>

          <EditorContent :editor="editor" class="prose-editor" />
        </div>

        <!-- ── Images ────────────────────────────────────── -->
        <div class="card-aged px-6 py-5 mb-8">
          <p class="section-label mb-3">圖片</p>
          <div v-if="loadingImages" class="text-xs font-body text-inkMuted flex items-center gap-1.5 mb-3">
            <span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> 載入圖片中…
          </div>
          <div class="flex flex-wrap gap-2">
            <div v-for="img in editingImages" :key="img.id" class="gear-img-thumb">
              <img :src="img.url" class="w-full h-full object-cover" />
              <button type="button" class="gear-img-remove" @click="removeExistingImage(img.id)">
                <XIcon :size="10" />
              </button>
            </div>
            <div v-for="(preview, i) in newImagePreviews" :key="preview" class="gear-img-thumb">
              <img :src="preview" class="w-full h-full object-cover" :class="saving ? 'opacity-50' : 'opacity-75'" />
              <button type="button" class="gear-img-remove" :disabled="saving" @click="removeNewImage(i)">
                <XIcon :size="10" />
              </button>
              <div v-if="saving" class="absolute inset-0 flex flex-col items-center justify-center gap-1"
                style="background: rgba(0,0,0,0.45);">
                <template v-if="newImageProgress[i] >= 100">
                  <CheckIcon :size="16" class="text-green-400" />
                </template>
                <template v-else>
                  <span class="text-white text-[10px] font-mono font-bold leading-none">{{ newImageProgress[i] }}%</span>
                  <div class="w-10 h-0.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.25);">
                    <div class="h-full rounded-full transition-all duration-100" style="background: white;"
                      :style="{ width: `${newImageProgress[i]}%` }" />
                  </div>
                </template>
              </div>
            </div>
            <button type="button"
              class="w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 text-inkMuted hover:text-primary hover:border-primary transition-colors cursor-pointer"
              style="border: 1px dashed var(--c-border);"
              @click="triggerImageInput"
            >
              <ImageIcon :size="18" class="opacity-50" />
              <span class="text-[10px] font-body">上傳</span>
            </button>
          </div>
          <input ref="imageInputRef" type="file" accept="image/*" multiple class="hidden" @change="onImagesSelected" />
        </div>

        <!-- Bottom save / cancel -->
        <div class="flex items-center justify-end gap-3 mb-12">
          <button
            class="px-4 py-2 rounded-lg text-sm font-body font-medium cursor-pointer card-aged text-inkMuted hover:text-ink transition-colors"
            @click="$router.push('/gear-library')"
          >取消</button>
          <button
            class="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-body font-semibold btn-cta cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import {
  ArrowLeft as ArrowLeftIcon, Save as SaveIcon, X as XIcon,
  AlertCircle as AlertCircleIcon,
  Bold as BoldIcon, Italic as ItalicIcon, Strikethrough as StrikethroughIcon,
  List as ListIcon, ListOrdered as ListOrderedIcon,
  Quote as QuoteIcon, Code as CodeIcon,
  Undo2 as Undo2Icon, Redo2 as Redo2Icon,
  Image as ImageIcon, Check as CheckIcon,
} from 'lucide-vue-next'
import type { Gear, GearImage, GearStatus } from '../types'
import { usePostStore } from '../stores/postStore'

const route  = useRoute()
const router = useRouter()
const store  = usePostStore()

const gearId = route.params.id as string

// ── Load gear ────────────────────────────────────────────
const loading  = ref(true)
const gear     = ref<Gear | null>(null)
const apiError = ref<string | null>(null)
const saving   = ref(false)

onMounted(async () => {
  await Promise.all([store.fetchGearLibrary(), store.fetchGearCategories()])
  const found = store.gearLibrary.find(g => g.id === gearId) ?? null
  gear.value = found
  if (found) {
    form.value = {
      name:         found.name,
      weight:       found.weight != null ? String(found.weight) : '',
      note:         found.note ?? '',
      category:     found.category,
      quantity:     found.quantity ?? 1,
      brand:        found.brand ?? '',
      referenceUrl: found.referenceUrl ?? '',
      price:        found.price != null ? String(found.price) : '',
      addedAt:      found.addedAt ?? '',
      status:       found.status ?? (found.isWishlist ? 'wishlist' : 'owned'),
    }
    editor.value?.commands.setContent(found.description ?? '')
    loadingImages.value = true
    try { editingImages.value = await store.fetchGearImages(gearId) }
    catch { /* ignore */ }
    finally { loadingImages.value = false }
  }
  loading.value = false
})

// ── Categories ───────────────────────────────────────────
const filterCategories = computed(() => {
  const all = new Set([
    ...store.gearCategories,
    ...store.gearLibrary.map(g => g.category).filter(Boolean),
  ])
  return [...all].sort((a, b) => a.localeCompare(b, 'zh-TW'))
})

// ── Form ─────────────────────────────────────────────────
type GearForm = {
  name: string; weight: string; note: string; category: string
  quantity: number; brand: string; referenceUrl: string; price: string
  addedAt: string; status: GearStatus
}

const statusOptions: { value: GearStatus; label: string }[] = [
  { value: 'owned',    label: '已擁有' },
  { value: 'wishlist', label: '願望清單' },
  { value: 'abandon',  label: '已淘汰' },
  { value: 'other',    label: '未分組' },
]

const form = ref<GearForm>({
  name: '', weight: '', note: '', category: '其他',
  quantity: 1, brand: '', referenceUrl: '', price: '', addedAt: '', status: 'other',
})

const formErrors = computed(() => {
  const e: Partial<Record<'weight' | 'price' | 'referenceUrl', string>> = {}
  const w = form.value.weight.trim()
  if (w !== '' && (isNaN(Number(w)) || Number(w) < 0)) e.weight = '重量需為有效數字'
  const p = form.value.price.trim()
  if (p !== '' && (isNaN(Number(p)) || Number(p) < 0)) e.price = '價格需為有效數字'
  const url = form.value.referenceUrl.trim()
  if (url && !/^https?:\/\//.test(url)) e.referenceUrl = '需以 http:// 或 https:// 開頭'
  return e
})
const hasFormErrors = computed(() => Object.keys(formErrors.value).length > 0)

// ── Rich text editor ─────────────────────────────────────
const editor = useEditor({
  extensions: [StarterKit],
  content: '',
  editorProps: {
    attributes: { class: 'prose-content' },
  },
})

onBeforeUnmount(() => editor.value?.destroy())

// ── Images ───────────────────────────────────────────────
const editingImages    = ref<GearImage[]>([])
const deletingImageIds = ref<string[]>([])
const newImageFiles    = ref<File[]>([])
const newImagePreviews = ref<string[]>([])
const newImageProgress = ref<number[]>([])
const loadingImages    = ref(false)
const imageInputRef    = ref<HTMLInputElement | null>(null)

function triggerImageInput() { imageInputRef.value?.click() }

function onImagesSelected(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  for (const file of files) {
    newImageFiles.value.push(file)
    newImagePreviews.value.push(URL.createObjectURL(file))
    newImageProgress.value.push(0)
  }
  if (imageInputRef.value) imageInputRef.value.value = ''
}

function removeExistingImage(imgId: string) {
  deletingImageIds.value.push(imgId)
  editingImages.value = editingImages.value.filter(img => img.id !== imgId)
}

function removeNewImage(index: number) {
  URL.revokeObjectURL(newImagePreviews.value[index])
  newImageFiles.value.splice(index, 1)
  newImagePreviews.value.splice(index, 1)
  newImageProgress.value.splice(index, 1)
}

onBeforeUnmount(() => { newImagePreviews.value.forEach(u => URL.revokeObjectURL(u)) })

// ── Submit ───────────────────────────────────────────────
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
      referenceUrl: form.value.referenceUrl.trim() || null,
      price:        form.value.price.trim() ? Number(form.value.price) : null,
      addedAt:      form.value.addedAt || null,
      status:       form.value.status,
      isWishlist:   form.value.status === 'wishlist',
      description:  editor.value?.getHTML() ?? null,
    }
    await store.updateLibraryGear(gearId, payload)
    for (const imgId of deletingImageIds.value) {
      await store.deleteGearImage(gearId, imgId)
    }
    for (let i = 0; i < newImageFiles.value.length; i++) {
      await store.uploadGearImageWithProgress(gearId, newImageFiles.value[i], (pct) => {
        newImageProgress.value[i] = pct
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
  font-size: 10px;
  font-family: Inter, sans-serif;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--c-inkMuted);
}

.field-label {
  display: block;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  color: var(--c-inkMuted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }

/* ── Status selector ──────────────────────────────────── */
.status-btn {
  padding: 5px 12px; border-radius: 20px;
  font-size: 12px; font-family: Inter, sans-serif; font-weight: 600;
  cursor: pointer; border: 1px solid var(--c-border);
  color: var(--c-inkMuted); background: transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.status-btn:hover { color: var(--c-ink); border-color: var(--c-ink); }
.status-btn--owned.status-btn--active    { color: var(--c-ink);     border-color: var(--c-ink);     background: color-mix(in srgb, var(--c-ink) 10%, transparent); }
.status-btn--wishlist.status-btn--active { color: var(--c-primary); border-color: var(--c-primary); background: color-mix(in srgb, var(--c-primary) 12%, transparent); }
.status-btn--abandon.status-btn--active  { color: #c47070;           border-color: #c47070;          background: rgba(196,112,112,0.1); }
.status-btn--other.status-btn--active    { color: var(--c-inkMuted); border-color: var(--c-inkMuted); background: color-mix(in srgb, var(--c-inkMuted) 10%, transparent); }

/* ── Editor toolbar ───────────────────────────────────── */
.editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 8px 8px 0 0;
  border: 1px solid var(--c-border);
  border-bottom: none;
  background: color-mix(in srgb, var(--c-card) 70%, var(--c-border) 30%);
}
.tb-btn {
  display: flex; align-items: center; justify-content: center;
  min-width: 28px; height: 26px; padding: 0 5px;
  border-radius: 5px; cursor: pointer;
  font-size: 11px; font-family: Inter, sans-serif; font-weight: 700;
  color: var(--c-inkMuted);
  transition: background 0.12s, color 0.12s;
}
.tb-btn:hover { background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-ink); }
.tb-btn--active { background: color-mix(in srgb, var(--c-primary) 18%, transparent); color: var(--c-primary); }
.tb-divider { width: 1px; height: 18px; background: var(--c-border); margin: 0 3px; opacity: 0.6; }

/* ── Editor content area ──────────────────────────────── */
.prose-editor {
  border: 1px solid var(--c-border);
  border-radius: 0 0 8px 8px;
  min-height: 220px;
  background: color-mix(in srgb, var(--c-base) 60%, var(--c-card) 40%);
  transition: border-color 0.15s;
}
.prose-editor:focus-within { border-color: var(--c-primary); }

.prose-editor :deep(.prose-content) {
  padding: 14px 16px;
  min-height: 220px;
  outline: none;
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: var(--c-ink);
}
.prose-editor :deep(.prose-content p) { margin: 0 0 0.6em; }
.prose-editor :deep(.prose-content h2) { font-family: 'Barlow Condensed', sans-serif; font-size: 1.25em; font-weight: 700; margin: 1em 0 0.4em; color: var(--c-ink); }
.prose-editor :deep(.prose-content h3) { font-family: 'Barlow Condensed', sans-serif; font-size: 1.1em; font-weight: 700; margin: 0.8em 0 0.3em; color: var(--c-ink); }
.prose-editor :deep(.prose-content ul) { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
.prose-editor :deep(.prose-content ol) { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
.prose-editor :deep(.prose-content li) { margin: 0.2em 0; }
.prose-editor :deep(.prose-content blockquote) {
  border-left: 3px solid var(--c-primary); padding-left: 12px; margin: 0.6em 0;
  color: var(--c-inkMuted); font-style: italic;
}
.prose-editor :deep(.prose-content code) {
  font-family: 'Space Mono', monospace; font-size: 0.85em;
  background: color-mix(in srgb, var(--c-primary) 10%, transparent);
  color: var(--c-primary); padding: 1px 5px; border-radius: 4px;
}
.prose-editor :deep(.prose-content strong) { color: var(--c-ink); font-weight: 700; }
.prose-editor :deep(.prose-content em) { font-style: italic; }
.prose-editor :deep(.prose-content s) { opacity: 0.5; }
.prose-editor :deep(.ProseMirror-focused) { outline: none; }

/* ── Image thumbnails ─────────────────────────────────── */
.gear-img-thumb {
  position: relative; width: 64px; height: 64px;
  border-radius: 8px; overflow: hidden; flex-shrink: 0;
  border: 1px solid var(--c-border);
}
.gear-img-remove {
  position: absolute; top: 3px; right: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(0,0,0,0.60); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.12s;
}
.gear-img-remove:hover { background: rgba(0,0,0,0.85); }
</style>
