<template>
  <div class="min-h-screen textured-bg vignette">

    <!-- Navbar -->
    <header class="sticky top-0 z-20 px-4 pt-4 pb-2">
      <div class="max-w-4xl mx-auto card-aged px-5 py-3 flex items-center gap-3"
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

    <main class="relative z-10 max-w-4xl mx-auto px-4 py-8">
      <div class="card-aged p-6">
        <Tabs :tabs="tabs" v-model:active="activeTab">
          <template #default="{ active }">

            <!-- 外觀 -->
            <div v-show="active === 'appearance'">
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
            </div>

            <!-- 記錄 -->
            <div v-show="active === 'records'" class="space-y-6">
              <div>
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
              </div>

              <div style="border-top: 1px solid var(--c-border);" class="pt-6">
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
              </div>
            </div>

            <!-- 難度 -->
            <div v-show="active === 'difficulty'">
              <DifficultySettings />
            </div>

            <!-- 通知 -->
            <div v-show="active === 'notifications'">
              <div class="flex items-center gap-2 mb-1">
                <svg viewBox="0 0 24 24" class="shrink-0" style="width:18px;height:18px;fill:var(--c-primary);">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                </svg>
                <h2 class="font-heading text-base text-ink tracking-wide">通知整合</h2>
              </div>
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
                  class="card-aged w-9 h-9 flex items-center justify-center rounded-lg text-inkMuted hover:text-ink transition-colors cursor-pointer shrink-0"
                  @click="showWebhook = !showWebhook"
                  :aria-label="showWebhook ? '隱藏' : '顯示'"
                >
                  <EyeOffIcon v-if="showWebhook" :size="14" />
                  <EyeIcon    v-else              :size="14" />
                </button>
              </div>
              <div class="mt-3 flex items-center gap-3">
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  :style="testState === 'success'
                    ? { background: 'color-mix(in srgb, #2ECC71 15%, transparent)', border: '1px solid #2ECC71', color: '#2ECC71' }
                    : testState === 'error'
                      ? { background: 'color-mix(in srgb, #E74C3C 15%, transparent)', border: '1px solid #E74C3C', color: '#E74C3C' }
                      : { border: '1px solid var(--c-border)', color: 'var(--c-inkMuted)' }"
                  :disabled="testState === 'loading' || !profile.discordWebhookUrl"
                  @click="runTest"
                >
                  <span v-if="testState === 'loading'" class="font-mono opacity-60">…</span>
                  <CheckIcon v-else-if="testState === 'success'" :size="12" />
                  <XIcon     v-else-if="testState === 'error'"   :size="12" />
                  <BellIcon  v-else                              :size="12" />
                  {{ testState === 'loading' ? '傳送中' : testState === 'success' ? '已送出' : testState === 'error' ? '傳送失敗' : '測試通知' }}
                </button>
                <p class="text-[11px] font-body text-inkMuted opacity-70">
                  在 Discord 頻道設定 → 整合 → Webhook 中取得 URL。
                </p>
              </div>
            </div>

          </template>
        </Tabs>
      </div>
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
  Bell as BellIcon,
  Check as CheckIcon,
  X as XIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
} from 'lucide-vue-next'
import { useProfileStore }  from '../stores/profileStore'
import { usePostStore }     from '../stores/postStore'
import DifficultySettings   from '../components/DifficultySettings.vue'
import Tabs                 from '../components/Tabs.vue'

const router      = useRouter()
const profile     = useProfileStore()
const postStore   = usePostStore()
const showWebhook = ref(false)
const activeTab   = ref('appearance')
const testState   = ref<'idle' | 'loading' | 'success' | 'error'>('idle')

async function runTest() {
  testState.value = 'loading'
  try {
    await profile.testDiscordWebhook()
    testState.value = 'success'
  } catch {
    testState.value = 'error'
  }
  setTimeout(() => { testState.value = 'idle' }, 3000)
}

const tabs = [
  { key: 'appearance',    label: '外觀' },
  { key: 'records',       label: '記錄' },
  { key: 'difficulty',    label: '難度' },
  { key: 'notifications', label: '通知' },
]

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
