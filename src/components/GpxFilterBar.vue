<template>
  <div class="card-aged px-5 py-4 mb-6 flex flex-wrap items-center gap-4">
    <div class="flex items-center gap-5 mr-auto flex-wrap">
      <div class="text-center">
        <p class="font-heading text-2xl font-bold text-ink leading-none mb-0.5">{{ store.gpxLibrary.length }}</p>
        <p class="text-[10px] font-body text-inkMuted uppercase tracking-widest">條路線</p>
      </div>
      <!-- Wishlist tab -->
      <div class="flex items-center rounded-lg overflow-hidden" style="border: 1px solid var(--c-border);">
        <button
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-body cursor-pointer transition-colors duration-150"
          :style="wishlistFilter === 'all'
            ? 'background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);'
            : 'background: transparent; color: var(--c-inkMuted);'"
          @click="wishlistFilter = 'all'"
        >全部</button>
        <div style="width: 1px; background: var(--c-border); align-self: stretch;" />
        <button
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-body cursor-pointer transition-colors duration-150"
          :style="wishlistFilter === 'wishlist'
            ? 'background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);'
            : 'background: transparent; color: var(--c-inkMuted);'"
          @click="wishlistFilter = 'wishlist'"
        ><BookmarkIcon :size="12" /> 願望清單</button>
        <div style="width: 1px; background: var(--c-border); align-self: stretch;" />
        <button
          class="flex items-center gap-1.5 px-3 py-2 text-xs font-body cursor-pointer transition-colors duration-150"
          :style="wishlistFilter === 'done'
            ? 'background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);'
            : 'background: transparent; color: var(--c-inkMuted);'"
          @click="wishlistFilter = 'done'"
        >已完成</button>
      </div>
    </div>

    <!-- Search -->
    <div class="relative flex-1 min-w-[180px]">
      <SearchIcon :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-inkMuted pointer-events-none" />
      <input
        v-model="search"
        type="text"
        placeholder="搜尋路線名稱…"
        class="w-full pl-8 pr-8 py-2 rounded-lg text-sm font-body text-ink focus:outline-none focus:border-primary transition-colors"
        style="background: transparent; border: 1px solid var(--c-border);"
      />
      <button v-if="search" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-inkMuted hover:text-ink cursor-pointer" @click="search = ''">
        <XIcon :size="13" />
      </button>
    </div>

    <!-- View mode toggle -->
    <div class="flex items-center rounded-lg overflow-hidden" style="border: 1px solid var(--c-border);">
      <button
        class="flex items-center gap-1.5 px-3 py-2 text-xs font-body cursor-pointer transition-colors duration-150"
        :style="viewMode === 'simple'
          ? 'background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);'
          : 'background: transparent; color: var(--c-inkMuted);'"
        @click="emit('update:viewMode', 'simple')"
      >
        <LayoutListIcon :size="13" />
        簡單
      </button>
      <div style="width: 1px; background: var(--c-border); align-self: stretch;" />
      <button
        class="flex items-center gap-1.5 px-3 py-2 text-xs font-body cursor-pointer transition-colors duration-150"
        :style="viewMode === 'advanced'
          ? 'background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-primary);'
          : 'background: transparent; color: var(--c-inkMuted);'"
        @click="emit('update:viewMode', 'advanced')"
      >
        <BarChart2Icon :size="13" />
        進階
      </button>
    </div>

    <!-- Filter button -->
    <div class="relative">
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
          v-if="hasActiveFilter"
          class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
          style="background: var(--c-primary); color: var(--c-base);"
        >{{ filtered.length }}</span>
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
          <!-- Difficulty -->
          <div class="flex items-center justify-between mb-2.5">
            <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted">難度</p>
            <button
              class="text-inkMuted hover:text-primary transition-colors cursor-pointer"
              :title="filterStars.length === profile.difficultyMax ? '取消全部' : '選取全部'"
              @click="filterStars = filterStars.length === profile.difficultyMax
                ? []
                : Array.from({ length: profile.difficultyMax }, (_, i) => i + 1)"
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
          <template v-if="postStore.availableTags.length">
            <div class="flex items-center justify-between mb-2.5">
              <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted">標籤</p>
              <button
                class="text-inkMuted hover:text-primary transition-colors cursor-pointer"
                :title="filterTags.length === postStore.availableTags.length ? '取消全部' : '選取全部'"
                @click="filterTags = filterTags.length === postStore.availableTags.length ? [] : [...postStore.availableTags]"
              >
                <CheckSquareIcon v-if="filterTags.length === postStore.availableTags.length" :size="14" />
                <SquareIcon v-else :size="14" />
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-4">
              <button
                v-for="tag in postStore.availableTags" :key="tag"
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
              :disabled="!hasActiveFilter"
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
  </div>
</template>

<script setup lang="ts">
import {
  Search as SearchIcon, X as XIcon, Bookmark as BookmarkIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  Square as SquareIcon, CheckSquare as CheckSquareIcon,
  LayoutList as LayoutListIcon, BarChart2 as BarChart2Icon,
} from 'lucide-vue-next'
import { useGpxLibraryStore } from '../stores/gpxLibraryStore'
import { useProfileStore } from '../stores/profileStore'
import { usePostStore } from '../stores/postStore'
import { useGpxFilter } from '../composables/useGpxFilter'

defineProps<{
  viewMode: 'simple' | 'advanced'
}>()

const emit = defineEmits<{
  'update:viewMode': [value: 'simple' | 'advanced']
}>()

const store     = useGpxLibraryStore()
const profile   = useProfileStore()
const postStore = usePostStore()

const {
  search, filterStars, filterTags, wishlistFilter, showFilterPanel,
  activeFilterCount, hasActiveFilter, filtered,
  toggleStars, toggleTag, clearFilters,
} = useGpxFilter()
</script>

<style scoped>
.filter-panel-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.filter-panel-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.filter-panel-enter-from, .filter-panel-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }
</style>
