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
            @click="theme.setMode(opt.value)"
            class="flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border cursor-pointer transition-all duration-150"
            :style="theme.mode === opt.value
              ? { borderColor: 'var(--c-primary)', background: 'color-mix(in srgb, var(--c-primary) 10%, transparent)' }
              : { borderColor: 'var(--c-border)' }"
          >
            <component
              :is="opt.icon"
              :size="20"
              :style="theme.mode === opt.value ? { color: 'var(--c-primary)' } : { color: 'var(--c-inkMuted)' }"
            />
            <span
              class="text-xs font-body font-medium"
              :style="theme.mode === opt.value ? { color: 'var(--c-primary)' } : { color: 'var(--c-inkMuted)' }"
            >{{ opt.label }}</span>
          </button>
        </div>
      </section>

      <!-- ② Difficulty -->
      <section class="card-aged p-6">
        <h2 class="font-heading text-base text-ink tracking-wide mb-1">登山難度設定</h2>
        <p class="text-xs font-body text-inkMuted mb-5">設定難度星等上限，並為每個等級加上說明</p>

        <!-- Max stars selector -->
        <div class="flex items-center gap-4 mb-6 pb-5" style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);">
          <span class="text-sm font-body text-inkMuted whitespace-nowrap">最高星等</span>
          <div class="flex gap-1.5">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              class="text-xl leading-none transition-colors duration-100 cursor-pointer"
              :style="n <= profile.difficultyMax
                ? { color: 'var(--c-primary)' }
                : { color: 'var(--c-inkMuted)', opacity: '0.25' }"
              @click="profile.setDifficultyMax(n)"
              :aria-label="`設定最高 ${n} 星`"
            >★</button>
          </div>
          <span class="text-xs font-mono text-inkMuted ml-auto">{{ profile.difficultyMax }} 星上限</span>
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
              style="font-size: 12px; letter-spacing: -2px; min-width: 64px;"
            >{{ '★'.repeat(n) }}{{ '☆'.repeat(profile.difficultyMax - n) }}</span>
            <input
              :value="profile.difficultyLabels[n - 1]"
              @input="profile.setDifficultyLabel(n - 1, ($event.target as HTMLInputElement).value)"
              type="text"
              class="input-field text-sm flex-1"
              :placeholder="`第 ${n} 級說明（選填）`"
            />
          </div>
        </div>

        <!-- Preview -->
        <div v-if="profile.difficultyMax > 0" class="mt-5 pt-4" style="border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);">
          <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted mb-3">預覽</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="n in profile.difficultyMax"
              :key="n"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style="background: color-mix(in srgb, var(--c-primary) 8%, transparent); border: 1px solid color-mix(in srgb, var(--c-primary) 20%, transparent);"
            >
              <span class="text-primary font-mono" style="font-size:11px;letter-spacing:-1px;">{{ '★'.repeat(n) }}</span>
              <span v-if="profile.difficultyLabels[n - 1]" class="text-xs font-body text-inkMuted">{{ profile.difficultyLabels[n - 1] }}</span>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ArrowLeft as ArrowLeftIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Monitor as MonitorIcon,
} from 'lucide-vue-next'
import { useThemeStore } from '../stores/themeStore'
import { useProfileStore } from '../stores/profileStore'

const router  = useRouter()
const theme   = useThemeStore()
const profile = useProfileStore()

const themeOptions = [
  { value: 'dark'  as const, label: '暗色', icon: MoonIcon    },
  { value: 'light' as const, label: '亮色', icon: SunIcon     },
  { value: 'auto'  as const, label: '跟隨系統', icon: MonitorIcon },
]
</script>
