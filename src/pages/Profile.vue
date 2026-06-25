<template>
  <div class="min-h-screen textured-bg vignette">

    <!-- Navbar -->
    <header class="sticky top-0 z-20 px-4 pt-4 pb-2">
      <div class="max-w-2xl mx-auto card-aged px-5 py-3 flex items-center gap-3"
           style="backdrop-filter: blur(10px);">
        <button
          @click="router.back()"
          class="card-aged w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200 shrink-0"
          aria-label="返回"
        >
          <ArrowLeftIcon :size="15" />
        </button>
        <span class="font-heading text-lg font-semibold text-ink tracking-wide">個人設定</span>
      </div>
    </header>

    <main class="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">

      <!-- ① Theme -->
      <section class="card-aged p-6">
        <h2 class="font-heading text-base text-ink tracking-wide mb-1">樣式風格</h2>
        <p class="text-xs font-body text-inkMuted mb-5">選擇介面配色，或跟隨裝置系統設定</p>
        <div class="flex gap-3">
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            @click="profile.setThemeMode(opt.value)"
            class="flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border cursor-pointer transition-all duration-150"
            :style="profile.themeMode === opt.value
              ? { borderColor: 'var(--c-primary)', background: 'color-mix(in srgb, var(--c-primary) 10%, transparent)' }
              : { borderColor: 'var(--c-border)' }"
          >
            <component
              :is="opt.icon"
              :size="20"
              :style="profile.themeMode === opt.value ? { color: 'var(--c-primary)' } : { color: 'var(--c-inkMuted)' }"
            />
            <span
              class="text-xs font-body font-medium"
              :style="profile.themeMode === opt.value ? { color: 'var(--c-primary)' } : { color: 'var(--c-inkMuted)' }"
            >{{ opt.label }}</span>
          </button>
        </div>
      </section>

      <!-- ② GPX Tags -->
      <section class="card-aged p-6">
        <h2 class="font-heading text-base text-ink tracking-wide mb-1">登山記錄標籤</h2>
        <p class="text-xs font-body text-inkMuted mb-4">所有已建立的 GPX 記錄標籤</p>
        <div v-if="postStore.availableTags.length === 0" class="text-xs font-body italic text-inkMuted">尚無標籤</div>
        <div v-else class="flex flex-wrap gap-2">
          <span
            v-for="tag in postStore.availableTags" :key="tag"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-semibold"
            style="background: color-mix(in srgb, var(--c-primary) 12%, transparent); border: 1px solid color-mix(in srgb, var(--c-primary) 30%, transparent); color: var(--c-primary);"
          >
            {{ tag }}
            <span v-if="tagCounts[tag]" class="font-mono opacity-60">{{ tagCounts[tag] }}</span>
          </span>
        </div>
      </section>

      <!-- ③ Gear Categories -->
      <section class="card-aged p-6">
        <h2 class="font-heading text-base text-ink tracking-wide mb-1">裝備類別</h2>
        <p class="text-xs font-body text-inkMuted mb-4">所有已建立的裝備類別</p>
        <div v-if="postStore.gearCategories.length === 0" class="text-xs font-body italic text-inkMuted">尚無類別</div>
        <div v-else class="flex flex-wrap gap-2">
          <span
            v-for="cat in postStore.gearCategories" :key="cat"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-semibold"
            style="background: color-mix(in srgb, var(--c-primary) 12%, transparent); border: 1px solid color-mix(in srgb, var(--c-primary) 30%, transparent); color: var(--c-primary);"
          >
            {{ cat }}
            <span v-if="catCounts[cat]" class="font-mono opacity-60">{{ catCounts[cat] }}</span>
          </span>
        </div>
      </section>

      <!-- ④ Difficulty -->
      <section class="card-aged p-6">
        <h2 class="font-heading text-base text-ink tracking-wide mb-1">登山難度設定</h2>
        <p class="text-xs font-body text-inkMuted mb-5">設定難度星等上限，並為每個等級加上說明</p>

        <!-- Max stepper -->
        <div class="flex items-center gap-4 mb-6 pb-5"
             style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);">
          <span class="text-sm font-body text-inkMuted">最高星等</span>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer font-mono text-base transition-colors duration-100"
              style="border: 1px solid var(--c-border);"
              :style="profile.difficultyMax <= 1 ? { opacity: '0.3', cursor: 'not-allowed' } : {}"
              @click="profile.setDifficultyMax(profile.difficultyMax - 1)"
              :disabled="profile.difficultyMax <= 1"
            >−</button>
            <span class="font-mono text-lg text-ink w-8 text-center">{{ profile.difficultyMax }}</span>
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer font-mono text-base transition-colors duration-100"
              style="border: 1px solid var(--c-border);"
              @click="profile.setDifficultyMax(profile.difficultyMax + 1)"
            >+</button>
          </div>
          <span class="text-primary font-mono ml-1" style="font-size:14px;letter-spacing:-1px;">
            {{ '★'.repeat(Math.min(profile.difficultyMax, 10)) }}{{ profile.difficultyMax > 10 ? `…(×${profile.difficultyMax})` : '' }}
          </span>
        </div>

        <!-- Per-level label editors -->
        <div class="space-y-3">
          <div
            v-for="n in profile.difficultyMax"
            :key="n"
            class="flex items-center gap-3"
          >
            <span
              class="font-mono shrink-0 text-primary"
              style="font-size: 12px; letter-spacing: -2px; min-width: 68px;"
            >
              <template v-if="n <= 10">{{ '★'.repeat(n) }}{{ '☆'.repeat(Math.min(profile.difficultyMax, 10) - n) }}</template>
              <template v-else>★×{{ n }}</template>
            </span>
            <input
              :value="profile.difficultyLabels[n - 1] ?? ''"
              @input="profile.setDifficultyLabel(n - 1, ($event.target as HTMLInputElement).value)"
              type="text"
              class="input-field text-sm flex-1"
              :placeholder="`第 ${n} 級說明（選填）`"
            />
          </div>
        </div>

        <!-- Preview -->
        <div v-if="profile.difficultyMax > 0" class="mt-5 pt-4"
             style="border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);">
          <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted mb-3">預覽</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="n in profile.difficultyMax"
              :key="n"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style="background: color-mix(in srgb, var(--c-primary) 8%, transparent); border: 1px solid color-mix(in srgb, var(--c-primary) 20%, transparent);"
            >
              <span class="text-primary font-mono" style="font-size:11px;letter-spacing:-1px;">
                <template v-if="n <= 10">{{ '★'.repeat(n) }}</template>
                <template v-else>★×{{ n }}</template>
              </span>
              <span v-if="profile.difficultyLabels[n - 1]" class="text-xs font-body text-inkMuted">
                {{ profile.difficultyLabels[n - 1] }}
              </span>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Monitor as MonitorIcon,
} from 'lucide-vue-next'
import { useProfileStore } from '../stores/profileStore'
import { usePostStore }    from '../stores/postStore'

const router    = useRouter()
const profile   = useProfileStore()
const postStore = usePostStore()

onMounted(() => {
  profile.fetchFromApi()
  postStore.fetchTags()
  postStore.fetchGearCategories()
  postStore.fetchPosts()
  postStore.fetchGearLibrary()
})

const tagCounts = computed(() => {
  const map: Record<string, number> = {}
  for (const post of postStore.posts) {
    for (const tag of post.tags ?? []) {
      map[tag] = (map[tag] ?? 0) + 1
    }
  }
  return map
})

const catCounts = computed(() => {
  const map: Record<string, number> = {}
  for (const gear of postStore.gearLibrary) {
    if (gear.category) map[gear.category] = (map[gear.category] ?? 0) + 1
  }
  return map
})

const themeOptions = [
  { value: 'dark'  as const, label: '暗色',   icon: MoonIcon    },
  { value: 'light' as const, label: '亮色',   icon: SunIcon     },
  { value: 'auto'  as const, label: '跟隨系統', icon: MonitorIcon },
]
</script>
