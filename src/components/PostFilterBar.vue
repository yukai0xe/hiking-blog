<template>
  <div class="filter-strip px-4 sm:px-0">

    <!-- Days filter chip -->
    <button
      class="filter-chip"
      :class="{ 'filter-chip--active': filterDays }"
      @click="showDaysPicker = true"
    >
      {{ daysLabel }}
      <ChevronDownIcon :size="11" class="opacity-50 ml-0.5 shrink-0" />
    </button>

    <!-- Date range -->
    <DateRangePicker v-model:start="filterDateStart" v-model:end="filterDateEnd" />

    <!-- More filters (logged-in only) -->
    <div v-if="isLoggedIn" class="ml-auto shrink-0">
      <button
        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body transition-colors duration-150 cursor-pointer border whitespace-nowrap"
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
    </div>

    <!-- Clear all -->
    <button
      v-if="hasActiveFilters"
      class="filter-clear flex items-center gap-1 px-3 rounded-lg text-xs font-body font-semibold cursor-pointer transition-colors duration-150 shrink-0"
      @click="clearFilters"
    >
      <XIcon :size="12" /> 清除篩選
    </button>

  </div>

  <!-- ── Days picker bottom sheet ───────────────────────────── -->
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="showDaysPicker" class="sheet-backdrop" @click.self="showDaysPicker = false">
        <div class="sheet-box">
          <div class="sheet-handle" />
          <p class="sheet-title">天數篩選</p>
          <button
            v-for="opt in DAYS_OPTIONS"
            :key="opt.value"
            class="sheet-row"
            :class="{ 'sheet-row--active': filterDays === opt.value }"
            @click="selectDays(opt.value)"
          >
            <CheckIcon v-if="filterDays === opt.value" :size="15" class="shrink-0 text-primary" />
            <span v-else class="w-[15px] shrink-0" />
            {{ opt.label }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── More filters bottom sheet ─────────────────────────── -->
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="showFilterPanel" class="sheet-backdrop" @click.self="showFilterPanel = false">
        <div class="sheet-box sheet-box--lg">
          <div class="sheet-handle" />

          <!-- Sheet header -->
          <div class="flex items-center justify-between px-5 pt-1 pb-3">
            <p class="sheet-title" style="padding: 0;">更多篩選</p>
            <button
              v-if="hasActiveFilters"
              class="text-xs font-body text-inkMuted hover:text-primary transition-colors cursor-pointer"
              @click="clearFilters"
            >清除篩選</button>
          </div>

          <!-- Scrollable content -->
          <div class="sheet-content">

            <!-- Weather -->
            <p class="section-label">天氣</p>
            <div class="flex flex-wrap gap-1.5 mb-5">
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
            <div class="flex items-center justify-between mb-2">
              <p class="section-label" style="margin:0;">難度</p>
              <button
                class="text-inkMuted hover:text-primary transition-colors cursor-pointer"
                :title="filterStars.length === profile.difficultyMax ? '取消全部' : '選取全部'"
                @click="toggleAllStars"
              >
                <CheckSquareIcon v-if="filterStars.length === profile.difficultyMax" :size="14" />
                <SquareIcon v-else :size="14" />
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-5">
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
              <div class="flex items-center justify-between mb-2">
                <p class="section-label" style="margin:0;">標籤</p>
                <button
                  class="text-inkMuted hover:text-primary transition-colors cursor-pointer"
                  :title="filterTags.length === store.availableTags.length ? '取消全部' : '選取全部'"
                  @click="toggleAllTags"
                >
                  <CheckSquareIcon v-if="filterTags.length === store.availableTags.length" :size="14" />
                  <SquareIcon v-else :size="14" />
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5 mb-2">
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

          </div>

          <!-- Footer -->
          <div class="sheet-footer">
            <button
              class="w-full btn-cta py-3 rounded-xl text-sm font-body font-semibold cursor-pointer"
              @click="showFilterPanel = false"
            >套用</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>

</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  X as XIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  Square as SquareIcon,
  CheckSquare as CheckSquareIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
} from 'lucide-vue-next'
import DateRangePicker from './DateRangePicker.vue'
import { usePostStore } from '../stores/postStore'
import { useProfileStore } from '../stores/profileStore'
import { usePostFilter } from '../composables/usePostFilter'

const WEATHER_OPTIONS = ['晴天', '多雲時晴', '多雲', '陰天', '小雨', '雨天', '大雨', '雷陣雨', '起霧', '下雪'] as const

const DAYS_OPTIONS = [
  { value: '',    label: '所有天數' },
  { value: '1',   label: '1 天' },
  { value: '2-3', label: '2–3 天' },
  { value: '4-7', label: '4–7 天' },
  { value: '7+',  label: '7 天以上' },
]

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

const showDaysPicker = ref(false)

const daysLabel = computed(() =>
  DAYS_OPTIONS.find(o => o.value === filterDays.value)?.label ?? '所有天數'
)

function selectDays(value: string) {
  filterDays.value      = value
  showDaysPicker.value  = false
}
</script>

<style scoped>
/* ── Filter strip ─────────────────────────────────────────── */
.filter-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);
}
.filter-strip::-webkit-scrollbar { display: none; }

@media (min-width: 640px) {
  .filter-strip {
    flex-wrap: wrap;
    overflow-x: visible;
    padding-bottom: 12px;
    margin-bottom: 24px;
    border-bottom: 1px solid color-mix(in srgb, var(--c-border) 30%, transparent);
  }
}

/* ── Chips ────────────────────────────────────────────────── */
.filter-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 7px 10px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  font-family: Inter, sans-serif; font-size: 13px;
  color: var(--c-ink);
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.filter-chip:hover { border-color: var(--c-inkMuted); }
.filter-chip--active {
  border-color: var(--c-primary);
  color: var(--c-primary);
  background: color-mix(in srgb, var(--c-primary) 8%, transparent);
}

.filter-clear {
  height: 34px;
  color: var(--c-inkMuted);
  border: 1px solid var(--c-border);
  white-space: nowrap;
}
.filter-clear:hover { color: var(--c-ink); border-color: var(--c-inkMuted); }

/* ── Bottom sheet ─────────────────────────────────────────── */
.sheet-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet-box {
  width: 100%;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 -8px 48px rgba(0,0,0,0.4);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.sheet-box--lg {
  max-height: 82vh;
  display: flex; flex-direction: column;
}

.sheet-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: color-mix(in srgb, var(--c-border) 70%, transparent);
  margin: 12px auto 4px;
  flex-shrink: 0;
}
.sheet-title {
  padding: 6px 20px 12px;
  font-family: var(--font-heading, sans-serif);
  font-size: 15px; font-weight: 600;
  color: var(--c-ink);
}
.sheet-row {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 13px 20px;
  font-family: var(--font-body, sans-serif); font-size: 14px;
  color: var(--c-ink); cursor: pointer; text-align: left;
  transition: background 0.12s;
  border: none; background: transparent;
}
.sheet-row:active, .sheet-row:hover { background: color-mix(in srgb, var(--c-primary) 6%, transparent); }
.sheet-row--active { color: var(--c-primary); }

.sheet-content {
  flex: 1; overflow-y: auto;
  padding: 4px 20px 8px;
}
.section-label {
  font-size: 10px; font-family: var(--font-body, sans-serif);
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--c-inkMuted); margin-bottom: 10px;
}
.sheet-footer {
  padding: 12px 20px;
  border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);
  flex-shrink: 0;
}

/* Desktop: centered modal */
@media (min-width: 640px) {
  .sheet-backdrop { align-items: center; padding: 1rem; }
  .sheet-box { border-radius: 16px; max-width: 420px; }
  .sheet-box--lg { max-height: 85vh; max-width: 380px; }
  .sheet-handle { display: none; }
}

/* ── Transitions ──────────────────────────────────────────── */
.sheet-fade-enter-active { transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-fade-leave-active { transition: opacity 0.16s ease, transform 0.2s ease; }
.sheet-fade-enter-from, .sheet-fade-leave-to { opacity: 0; transform: translateY(60%); }

@media (min-width: 640px) {
  .sheet-fade-enter-from, .sheet-fade-leave-to { opacity: 0; transform: scale(0.97); }
}
</style>
