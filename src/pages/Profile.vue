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
      <DifficultySettings />

      <!-- ⑤ Notifications -->
      <section class="card-aged p-6">
        <h2 class="font-heading text-base text-ink tracking-wide mb-1">通知整合</h2>
        <p class="text-xs font-body text-inkMuted mb-5">每週垃圾桶清理完成後，透過 Discord Webhook 發送通知</p>

        <label class="block mb-1.5 text-xs font-body font-medium text-inkMuted">Discord Webhook URL</label>
        <div class="flex gap-2">
          <input
            :type="showWebhook ? 'text' : 'password'"
            :value="profile.discordWebhookUrl"
            @input="profile.setDiscordWebhookUrl(($event.target as HTMLInputElement).value)"
            placeholder="https://discord.com/api/webhooks/..."
            class="flex-1 px-3 py-2 rounded-lg text-sm font-mono text-ink bg-transparent border outline-none transition-colors"
            style="border-color: var(--c-border);"
            @focus="($event.target as HTMLInputElement).style.borderColor = 'var(--c-primary)'"
            @blur="($event.target as HTMLInputElement).style.borderColor = 'var(--c-border)'"
          />
          <button
            class="card-aged px-3 rounded-lg text-xs font-body text-inkMuted hover:text-ink transition-colors cursor-pointer shrink-0"
            @click="showWebhook = !showWebhook"
          >{{ showWebhook ? '隱藏' : '顯示' }}</button>
        </div>
        <p class="mt-2 text-[11px] font-body text-inkMuted opacity-70">
          在 Discord 頻道設定 → 整合 → Webhook 中取得 URL。儲存後自動生效。
        </p>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Monitor as MonitorIcon,
} from 'lucide-vue-next'
import { useProfileStore } from '../stores/profileStore'
import { usePostStore }    from '../stores/postStore'
import DifficultySettings  from '../components/DifficultySettings.vue'

const router      = useRouter()
const profile     = useProfileStore()
const showWebhook = ref(false)
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
