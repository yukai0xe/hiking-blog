<template>
  <div class="search-bar card-aged p-3 mb-6 flex flex-wrap gap-2">

    <!-- Days -->
    <select v-model="filterDays" class="filter-select">
      <option value="">所有天數</option>
      <option value="1">1 天</option>
      <option value="2-3">2–3 天</option>
      <option value="4-7">4–7 天</option>
      <option value="7+">7 天以上</option>
    </select>

    <!-- Date range -->
    <DateRangePicker v-model:start="filterDateStart" v-model:end="filterDateEnd" />

    <!-- More filters (logged-in only) -->
    <div v-if="isLoggedIn" class="relative ml-auto">
      <button
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body transition-colors duration-150 cursor-pointer border"
        :style="showFilterPanel || activeFilterCount > 0
          ? 'border-color: var(--c-primary); color: var(--c-primary); background: color-mix(in srgb, var(--c-primary) 8%, transparent);'
          : 'border-color: var(--c-border); color: var(--c-inkMuted); background: transparent;'"
        @click="showFilterPanel = !showFilterPanel"
      >
        <SlidersHorizontalIcon :size="13" />
        更多篩選
        <span
          v-if="activeFilterCount > 0"
          class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
          style="background: var(--c-primary); color: var(--c-base);"
        >{{ activeFilterCount }}</span>
      </button>

      <!-- Backdrop -->
      <div v-if="showFilterPanel" class="fixed inset-0 z-10" @click="showFilterPanel = false" />

      <!-- Filter panel -->
      <Transition name="filter-panel">
        <div
          v-if="showFilterPanel"
          class="absolute right-0 mt-2 w-72 card-aged rounded-xl p-4 z-20 shadow-xl"
          style="border: 1px solid color-mix(in srgb, var(--c-border) 80%, transparent);"
        >
          <!-- Weather -->
          <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted mb-2.5">天氣</p>
          <div class="flex flex-wrap gap-1.5 mb-4">
            <button
              v-for="w in WEATHER_OPTIONS" :key="w"
              class="px-2.5 py-1 rounded-full text-xs font-body transition-colors duration-150 cursor-pointer border"
              :style="filterWeather === w
                ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
              @click="toggleWeather(w)"
            >{{ w }}</button>
          </div>

          <!-- Difficulty -->
          <div class="flex items-center justify-between mb-2.5">
            <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted">難度</p>
            <button
              class="text-inkMuted hover:text-primary transition-colors cursor-pointer"
              :title="filterStars.length === profile.difficultyMax ? '取消全部' : '選取全部'"
              @click="toggleAllStars"
            >
              <CheckSquareIcon v-if="filterStars.length === profile.difficultyMax" :size="14" />
              <SquareIcon v-else :size="14" />
            </button>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-4">
            <button
              v-for="n in profile.difficultyMax" :key="n"
              class="px-2.5 py-1 rounded-full text-xs font-mono transition-colors duration-150 cursor-pointer border"
              :style="filterStars.includes(n)
                ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
              :title="profile.difficultyLabels[n - 1] || undefined"
              @click="toggleStars(n)"
            >{{ n <= 10 ? '★'.repeat(n) : `★×${n}` }}</button>
          </div>

          <!-- Tags -->
          <template v-if="store.availableTags.length">
            <div class="flex items-center justify-between mb-2.5">
              <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted">標籤</p>
              <button
                class="text-inkMuted hover:text-primary transition-colors cursor-pointer"
                :title="filterTags.length === store.availableTags.length ? '取消全部' : '選取全部'"
                @click="toggleAllTags"
              >
                <CheckSquareIcon v-if="filterTags.length === store.availableTags.length" :size="14" />
                <SquareIcon v-else :size="14" />
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-4">
              <button
                v-for="tag in store.availableTags" :key="tag"
                class="px-2.5 py-1 rounded-full text-xs font-body transition-colors duration-150 cursor-pointer border"
                :style="filterTags.includes(tag)
                  ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                  : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
                @click="toggleTag(tag)"
              >{{ tag }}</button>
            </div>
          </template>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-3 border-t" style="border-color: var(--c-border);">
            <button
              class="text-xs font-body text-inkMuted hover:text-ink transition-colors cursor-pointer disabled:opacity-30"
              :disabled="!hasActiveFilters"
              @click="clearFilters"
            >清除篩選</button>
            <button
              class="px-3 py-1 rounded-lg text-xs font-body btn-cta cursor-pointer"
              @click="showFilterPanel = false"
            >套用</button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Clear all (outside panel) -->
    <button
      v-if="hasActiveFilters"
      class="filter-clear flex items-center gap-1 px-3 rounded-lg text-xs font-body font-semibold cursor-pointer transition-colors duration-150"
      @click="clearFilters"
    >
      <XIcon :size="12" /> 清除篩選
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  X as XIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  Square as SquareIcon, CheckSquare as CheckSquareIcon,
} from 'lucide-vue-next'
import DateRangePicker from './DateRangePicker.vue'
import { usePostStore } from '../stores/postStore'
import { useProfileStore } from '../stores/profileStore'
import { usePostFilter } from '../composables/usePostFilter'

const WEATHER_OPTIONS = ['晴天', '多雲時晴', '多雲', '陰天', '小雨', '雨天', '大雨', '雷陣雨', '起霧', '下雪'] as const

defineProps<{ isLoggedIn: boolean }>()

const store   = usePostStore()
const profile = useProfileStore()

const {
  filterWeather, filterDays, filterDateStart, filterDateEnd,
  filterStars, filterTags, showFilterPanel,
  activeFilterCount, hasActiveFilters,
  toggleWeather, toggleStars, toggleAllStars,
  toggleTag, toggleAllTags, clearFilters,
} = usePostFilter()
</script>

<style scoped>
.search-bar {
  align-items: center;
}

.filter-select {
  padding: 7px 10px;
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  font-family: Inter, sans-serif;
  font-size: 13px;
  color: var(--c-ink);
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
  min-width: 110px;
}
.filter-select:focus { border-color: var(--c-primary); }
.filter-select option { background: var(--c-card); color: var(--c-ink); }

.filter-clear {
  height: 34px;
  color: var(--c-inkMuted);
  border: 1px solid var(--c-border);
  white-space: nowrap;
}
.filter-clear:hover {
  color: var(--c-ink);
  border-color: var(--c-inkMuted);
}

.filter-panel-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.filter-panel-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.filter-panel-enter-from, .filter-panel-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }
</style>
