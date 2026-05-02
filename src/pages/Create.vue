<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 max-w-2xl mx-auto px-4">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-8">
        <button
          class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200 text-inkMuted hover:text-ink"
          @click="$router.back()" aria-label="返回"
        >
          <ArrowLeftIcon :size="17" />
        </button>
        <div>
          <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">New Entry</p>
          <h1 class="font-heading text-xl font-bold text-ink">新增登山記錄</h1>
        </div>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center mb-8 card-aged p-4">
        <template v-for="(label, i) in stepLabels" :key="i">
          <div class="flex flex-col items-center gap-1">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200"
              :class="
                step > i + 1  ? 'bg-secondary text-ink opacity-80' :
                step === i + 1 ? 'bg-primary text-[var(--c-cta-text)] shadow-md' :
                                 'bg-border/40 text-inkMuted'
              "
            >
              <CheckIcon v-if="step > i + 1" :size="14" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="text-[10px] tracking-wide hidden sm:block font-body"
              :class="
                step === i + 1 ? 'text-primary' :
                step > i + 1   ? 'text-inkMuted' :
                                 'text-inkMuted opacity-40'"
            >{{ label }}</span>
          </div>
          <div v-if="i < stepLabels.length - 1" class="flex-1 h-px mx-2 transition-colors duration-300"
            :class="step > i + 1 ? 'bg-secondary opacity-60' : 'bg-border opacity-40'" />
        </template>
      </div>

      <!-- Form card -->
      <div class="card-aged p-6">

        <!-- Step 1 -->
        <div v-if="step === 1" class="space-y-5">
          <h2 class="font-heading text-xl text-ink mb-4">基本資訊</h2>
          <div>
            <label class="block text-xs font-body font-semibold text-inkMuted tracking-widest uppercase mb-1.5">標題</label>
            <input v-model="form.title" type="text" class="input-field" placeholder="這次登山的名稱" />
          </div>
          <div>
            <label class="block text-xs font-body font-semibold text-inkMuted tracking-widest uppercase mb-2">標籤</label>
            <!-- Selected tags display -->
            <div class="flex flex-wrap gap-2 mb-2">
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

        <!-- Step 2: GPX + 行程資訊 -->
        <div v-else-if="step === 2" class="space-y-5">
          <h2 class="font-heading text-xl text-ink mb-4">GPX 軌跡</h2>
          <div
            class="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200"
            :class="form.gpxFile ? 'border-primary/50 bg-primary/5' : 'border-border/40 hover:border-primary/40'"
            @click="gpxInput?.click()" @dragover.prevent @drop.prevent="onGpxDrop"
          >
            <div v-if="form.gpxFile" class="flex flex-col items-center gap-2">
              <RouteIcon :size="30" class="text-primary" />
              <p class="font-heading text-ink">{{ form.gpxFile.name }}</p>
              <p class="text-xs text-inkMuted font-mono">{{ (form.gpxFile.size / 1024).toFixed(1) }} KB</p>
            </div>
            <div v-else class="flex flex-col items-center gap-2">
              <UploadIcon :size="30" class="text-inkMuted opacity-40" />
              <p class="text-inkMuted font-body">點擊或拖曳上傳 GPX 檔案</p>
              <p class="text-xs text-inkMuted/50 font-body italic">僅支援 .gpx 格式</p>
            </div>
          </div>
          <input ref="gpxInput" type="file" accept=".gpx" class="hidden" @change="onGpxChange" />
          <p v-if="gpxError" class="text-red-400 text-sm flex items-center gap-1 font-body">
            <AlertCircleIcon :size="14" /> {{ gpxError }}
          </p>

          <div class="pt-1 border-t border-border/30 space-y-4">
            <!-- 描述 -->
            <div>
              <label class="block text-xs font-body font-semibold text-inkMuted tracking-widest uppercase mb-1.5">描述</label>
              <textarea v-model="form.description" rows="4" class="input-field resize-none" placeholder="記錄這次登山的心得…" />
            </div>

            <!-- 日期區段 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-body font-semibold text-inkMuted tracking-widest uppercase mb-1.5">開始日期</label>
                <input v-model="form.dateStart" type="date" class="input-field font-mono text-sm" />
              </div>
              <div>
                <label class="block text-xs font-body font-semibold text-inkMuted tracking-widest uppercase mb-1.5">結束日期</label>
                <input v-model="form.dateEnd" type="date" class="input-field font-mono text-sm" />
              </div>
            </div>

            <!-- 天氣 + 人數 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-body font-semibold text-inkMuted tracking-widest uppercase mb-1.5">天氣</label>
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
                <label class="block text-xs font-body font-semibold text-inkMuted tracking-widest uppercase mb-1.5">人數</label>
                <input v-model.number="form.peopleCount" type="number" min="1" max="999" class="input-field" placeholder="隊員人數" />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Cover -->
        <div v-else-if="step === 3" class="space-y-4">
          <h2 class="font-heading text-xl text-ink mb-4">封面圖片</h2>
          <div
            class="border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
            :class="coverPreview ? 'border-primary/50' : 'border-border/40 hover:border-primary/40'"
            @click="coverInput?.click()"
          >
            <img v-if="coverPreview" :src="coverPreview" class="w-full max-h-64 object-cover opacity-85" alt="封面預覽" />
            <div v-else class="p-10 flex flex-col items-center gap-2">
              <ImageIcon :size="30" class="text-inkMuted opacity-40" />
              <p class="text-inkMuted font-body">點擊選擇封面圖片</p>
            </div>
          </div>
          <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverChange" />
        </div>

        <!-- Step 4: Photos -->
        <div v-else-if="step === 4" class="space-y-4">
          <h2 class="font-heading text-xl text-ink mb-1">照片集</h2>
          <p class="text-inkMuted text-sm font-body italic mb-4">選填</p>
          <div
            class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 border-border/40 hover:border-primary/40"
            @click="photosInput?.click()"
          >
            <CameraIcon :size="30" class="text-inkMuted opacity-40 mx-auto mb-2" />
            <p class="text-inkMuted font-body">點擊選擇多張照片</p>
            <p v-if="form.photoFiles.length" class="text-sm font-semibold mt-1 text-primary font-mono">
              已選 {{ form.photoFiles.length }} 張
            </p>
          </div>
          <input ref="photosInput" type="file" accept="image/*" multiple class="hidden" @change="onPhotosChange" />
          <div v-if="photoPreviews.length" class="grid grid-cols-3 gap-2">
            <div v-for="(src, i) in photoPreviews" :key="i" class="aspect-square overflow-hidden rounded-lg">
              <img :src="src" class="w-full h-full object-cover opacity-80" alt="" />
            </div>
          </div>
        </div>

        <!-- Step 5: Gear -->
        <div v-else-if="step === 5" class="space-y-4">
          <h2 class="font-heading text-xl text-ink mb-1">裝備清單</h2>
          <p class="text-inkMuted text-sm font-body italic mb-4">選填</p>
          <div v-for="(gear, i) in form.gears" :key="i" class="flex gap-2 items-center">
            <div class="flex-1 grid grid-cols-3 gap-2">
              <input v-model="gear.name" type="text" placeholder="名稱" class="input-field text-sm py-2" />
              <input v-model.number="gear.weight" type="number" placeholder="重量 (g)" class="input-field text-sm py-2" />
              <input v-model="gear.note" type="text" placeholder="備注" class="input-field text-sm py-2" />
            </div>
            <button class="text-inkMuted hover:text-red-400 transition-colors duration-150 cursor-pointer opacity-50 hover:opacity-100"
              @click="removeGear(i)" aria-label="刪除">
              <Trash2Icon :size="15" />
            </button>
          </div>
          <button class="flex items-center gap-1.5 text-sm font-semibold font-body cursor-pointer text-primary hover:opacity-70 transition-opacity duration-150"
            @click="addGear">
            <PlusIcon :size="15" /> 新增裝備
          </button>
        </div>

        <!-- Navigation -->
        <div class="flex justify-between mt-8 pt-6 border-t border-border/40">
          <button v-if="step > 1"
            class="flex items-center gap-1.5 px-5 py-2.5 rounded-lg card-aged text-inkMuted font-body font-medium cursor-pointer hover:text-ink transition-colors duration-200"
            @click="step--">
            <ArrowLeftIcon :size="14" /> 上一步
          </button>
          <div v-else />

          <button v-if="step < 5"
            class="btn-cta flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold font-body cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="!canNext" @click="nextStep">
            下一步 <ArrowRightIcon :size="14" />
          </button>
          <button v-else
            class="btn-cta flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold font-body cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="store.loading" @click="submit">
            <span v-if="store.loading" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent" />
            <CheckIcon v-else :size="15" />
            {{ store.loading ? '上傳中…' : '完成送出' }}
          </button>
        </div>

        <p v-if="store.error" class="text-red-400 text-sm mt-4 flex items-center gap-1 font-body">
          <AlertCircleIcon :size="14" /> {{ store.error }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon,
  Check as CheckIcon, Plus as PlusIcon, Upload as UploadIcon,
  Route as RouteIcon, Image as ImageIcon, Camera as CameraIcon,
  Trash2 as Trash2Icon, AlertCircle as AlertCircleIcon,
  X as XIcon, Tag as TagIcon,
} from 'lucide-vue-next'
import { usePostStore } from '../stores/postStore'
import TagPickerModal from '../components/TagPickerModal.vue'
import defaultCoverUrl from '../assets/cover_default.png'

const router = useRouter()
const store = usePostStore()
const tagModalOpen = ref(false)

const step = ref(1)
const stepLabels = ['基本', 'GPX', '封面', '照片', '裝備']


const form = ref({
  title:        '',
  description:  '',
  gpxFile:      null as File | null,
  dateStart:    '',
  dateEnd:      '',
  weather:      '',
  peopleCount:  null as number | null,
  coverFile:    null as File | null,
  photoFiles:   [] as File[],
  gears:        [] as { name: string; weight: number; note: string }[],
  tags:         [] as string[],
})


const gpxInput = ref<HTMLInputElement | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const photosInput = ref<HTMLInputElement | null>(null)
const coverPreview = ref<string | null>(null)
const photoPreviews = ref<string[]>([])
const gpxError = ref<string | null>(null)

const canNext = computed(() => true)

function nextStep() { if (canNext.value) step.value++ }

function onGpxChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.name.endsWith('.gpx')) { gpxError.value = '請上傳 .gpx 格式'; return }
  gpxError.value = null
  form.value.gpxFile = file
}

function onGpxDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0]
  if (!file) return
  if (!file.name.endsWith('.gpx')) { gpxError.value = '請上傳 .gpx 格式'; return }
  gpxError.value = null
  form.value.gpxFile = file
}

function onCoverChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  form.value.coverFile = file
  coverPreview.value = URL.createObjectURL(file)
}

function onPhotosChange(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  form.value.photoFiles = files
  photoPreviews.value = files.map(f => URL.createObjectURL(f))
}

function addGear() { form.value.gears.push({ name: '', weight: 0, note: '' }) }
function removeGear(i: number) { form.value.gears.splice(i, 1) }

async function submit() {
  try {
    // 封面預設
    let coverFile = form.value.coverFile
    if (!coverFile) {
      const res  = await fetch(defaultCoverUrl)
      const blob = await res.blob()
      coverFile  = new File([blob], 'cover_default.png', { type: blob.type })
    }

    const id = await store.createPost({
      title:        form.value.title.trim() || '登山紀錄',
      description:  form.value.description,
      coverFile,
      gpxFile:      form.value.gpxFile,
      photoFiles:   form.value.photoFiles,
      gears:        form.value.gears.filter(g => g.name.trim()),
      dateStart:    form.value.dateStart  || undefined,
      dateEnd:      form.value.dateEnd    || undefined,
      weather:      form.value.weather    || undefined,
      peopleCount:  form.value.peopleCount,
      tags:         form.value.tags,
    })
    router.push(`/detail/${id}`)
  } catch { /* error shown via store.error */ }
}
</script>
