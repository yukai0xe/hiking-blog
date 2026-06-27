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
        <div class="flex-1 min-w-0">
          <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">Gear Library</p>
          <h1 class="font-heading text-xl font-bold text-ink truncate">{{ gear?.name ?? '…' }}</h1>
        </div>
        <button
          class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body font-semibold btn-cta cursor-pointer"
          @click="$router.push('/gear-library/edit/' + gearId)"
        >
          <PencilIcon :size="14" />
          編輯
        </button>
      </div>

      <!-- Loading -->
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

        <!-- ── Info card ──────────────────────────────────── -->
        <div class="card-aged px-6 py-5 mb-5">

          <!-- Status badge -->
          <div class="mb-4">
            <GearStatusBadge :status="gearStatus(gear!)" />
          </div>

          <!-- Fields grid -->
          <div class="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <div v-if="gear.category">
              <p class="field-label">類別</p>
              <p class="field-value"><span class="cat-badge">{{ gear.category }}</span></p>
            </div>
            <div v-if="gear.brand">
              <p class="field-label">品牌</p>
              <p class="field-value font-body text-ink">{{ gear.brand }}</p>
            </div>
            <div>
              <p class="field-label">重量 × 數量</p>
              <p class="field-value font-mono text-ink">
                {{ gear.weight ?? 0 }} g
                <span class="text-inkMuted text-xs">× {{ gear.quantity ?? 1 }}</span>
                <span class="text-inkMuted text-xs ml-1">= {{ (gear.weight ?? 0) * (gear.quantity ?? 1) }} g</span>
              </p>
            </div>
            <div v-if="gear.price != null">
              <p class="field-label">價格</p>
              <p class="field-value font-mono text-ink">{{ gear.price.toLocaleString() }}</p>
            </div>
            <div v-if="gear.addedAt">
              <p class="field-label">加入時間</p>
              <p class="field-value font-body text-ink">{{ gear.addedAt }}</p>
            </div>
            <div v-if="gear.referenceUrl" class="col-span-2 sm:col-span-1">
              <p class="field-label">參考連結</p>
              <div class="space-y-1.5">
                <a
                  v-for="(url, i) in gear.referenceUrl.split('\n').filter(Boolean)"
                  :key="i"
                  :href="url" target="_blank" rel="noopener noreferrer"
                  class="field-value font-body text-primary hover:opacity-70 transition-opacity flex items-center gap-1 truncate"
                >
                  <ExternalLinkIcon :size="12" class="shrink-0" />
                  <span class="truncate">{{ url }}</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Note -->
          <div v-if="gear.note" class="mt-4 pt-4 border-t border-border/30">
            <p class="field-label">備註</p>
            <p class="font-body text-sm text-inkMuted italic leading-relaxed mt-1">{{ gear.note }}</p>
          </div>
        </div>

        <!-- ── Description ────────────────────────────────── -->
        <div v-if="hasDescription" class="card-aged px-6 py-5 mb-5">
          <p class="section-label mb-4">詳細說明</p>
          <div class="prose-view" v-html="gear.description" />
        </div>

        <!-- ── Images ─────────────────────────────────────── -->
        <div class="card-aged px-6 py-5 mb-8">
          <p class="section-label mb-4">圖片</p>
          <div v-if="loadingImages" class="text-xs font-body text-inkMuted flex items-center gap-1.5">
            <span class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> 載入圖片中…
          </div>
          <div v-else-if="images.length === 0" class="text-sm font-body italic text-inkMuted">此裝備無圖片</div>
          <PhotoGallery v-else :photos="images" />
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon,
  Pencil as PencilIcon,
  ExternalLink as ExternalLinkIcon,
} from 'lucide-vue-next'
import type { Gear, GearImage } from '../types'
import { usePostStore } from '../stores/postStore'
import { gearStatus } from '../composables/useGearStats'
import PhotoGallery from '../components/PhotoGallery.vue'
import GearStatusBadge from '../components/GearStatusBadge.vue'

const route = useRoute()
const store = usePostStore()

const gearId = route.params.id as string

const loading      = ref(true)
const gear         = ref<Gear | null>(null)
const loadingImages = ref(false)
const images       = ref<GearImage[]>([])

onMounted(async () => {
  await store.fetchGearLibrary()
  gear.value = store.gearLibrary.find(g => g.id === gearId) ?? null
  loading.value = false
  if (gear.value) {
    loadingImages.value = true
    try { images.value = await store.fetchGearImages(gearId) }
    catch { /* ignore */ }
    finally { loadingImages.value = false }
  }
})

const hasDescription = computed(() => {
  const d = gear.value?.description
  if (!d) return false
  const stripped = d.replace(/<[^>]*>/g, '').trim()
  return stripped.length > 0
})
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
  font-size: 10px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--c-inkMuted);
  margin-bottom: 3px;
}

.field-value {
  font-size: 14px;
  line-height: 1.4;
}

/* ── Category badge (matches GearLibrary) ──────────────── */
.cat-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: Inter, sans-serif;
  font-weight: 600;
  background: color-mix(in srgb, var(--c-primary) 12%, transparent);
  color: var(--c-primary);
}

/* ── Prose read view ──────────────────────────────────── */
.prose-view {
  font-family: Inter, sans-serif;
  font-size: 14px;
  line-height: 1.75;
  color: var(--c-ink);
}
.prose-view :deep(p)          { margin: 0 0 0.65em; }
.prose-view :deep(h2)         { font-family: 'Barlow Condensed', sans-serif; font-size: 1.3em; font-weight: 700; margin: 1.1em 0 0.4em; color: var(--c-ink); }
.prose-view :deep(h3)         { font-family: 'Barlow Condensed', sans-serif; font-size: 1.1em; font-weight: 700; margin: 0.9em 0 0.3em; color: var(--c-ink); }
.prose-view :deep(ul)         { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
.prose-view :deep(ol)         { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
.prose-view :deep(li)         { margin: 0.2em 0; }
.prose-view :deep(blockquote) { border-left: 3px solid var(--c-primary); padding-left: 12px; margin: 0.7em 0; color: var(--c-inkMuted); font-style: italic; }
.prose-view :deep(code)       { font-family: 'Space Mono', monospace; font-size: 0.85em; background: color-mix(in srgb, var(--c-primary) 10%, transparent); color: var(--c-primary); padding: 1px 5px; border-radius: 4px; }
.prose-view :deep(strong)     { color: var(--c-ink); font-weight: 700; }
.prose-view :deep(em)         { font-style: italic; }
.prose-view :deep(s)          { opacity: 0.5; }
</style>
