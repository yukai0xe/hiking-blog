<template>
  <div class="min-h-screen textured-bg vignette">

    <!-- Navbar -->
    <header class="sticky top-0 z-20 px-4 pt-4 pb-2">
      <div class="max-w-7xl mx-auto card-aged px-5 py-3 flex items-center justify-between"
           style="backdrop-filter: blur(10px);">
        <div class="flex items-center gap-2.5">
          <CompassIcon :size="20" class="text-primary" />
          <span class="font-heading text-lg font-semibold text-ink tracking-wide">Expedition Log</span>
        </div>
        <div class="flex items-center gap-2">
          <router-link v-if="auth.user" to="/create" class="nav-icon-btn" aria-label="新增記錄">
            <PlusIcon :size="17" class="nav-icon-btn__icon" />
            <span class="nav-icon-btn__label">新增記錄</span>
          </router-link>

          <!-- Not logged in -->
          <button
            v-if="!auth.user"
            @click="auth.login()"
            class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          >
            <LogInIcon :size="15" />
            登入
          </button>

          <!-- Logged in: avatar + dropdown -->
          <div v-else ref="avatarDropdownRoot" class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              class="avatar-btn"
              :class="{ 'avatar-btn--open': showUserMenu }"
            >
              <img
                v-if="auth.user.avatarUrl"
                :src="auth.user.avatarUrl"
                class="w-full h-full object-cover"
                alt="avatar"
              />
              <span v-else class="font-heading text-sm font-bold" style="color: var(--c-base);">
                {{ auth.user.name?.[0]?.toUpperCase() ?? '?' }}
              </span>
            </button>

            <Transition name="dropdown">
              <div
                v-if="showUserMenu"
                class="avatar-menu"
              >
                <!-- User info -->
                <div class="px-3 py-2.5 mb-1" style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
                  <p class="text-xs font-body font-semibold text-ink truncate">{{ auth.user.name || '使用者' }}</p>
                  <p class="text-[11px] font-body text-inkMuted truncate">{{ auth.user.email }}</p>
                </div>

                <!-- Navigation -->
                <router-link to="/gpx-library" @click="showUserMenu = false" class="menu-row">
                  <RouteIcon :size="14" class="shrink-0" />
                  GPX 收藏
                </router-link>
                <router-link to="/gear-library" @click="showUserMenu = false" class="menu-row">
                  <LibraryIcon :size="14" class="shrink-0" />
                  裝備庫
                </router-link>

                <!-- Settings -->
                <div style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent); margin: 4px 0;" />
                <router-link to="/profile" @click="showUserMenu = false" class="menu-row">
                  <SettingsIcon :size="14" class="shrink-0" />
                  個人設定
                </router-link>

                <!-- Logout -->
                <div style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent); margin: 4px 0;" />
                <button @click="confirmLogout" class="menu-row menu-row--danger w-full text-left">
                  <LogOutIcon :size="14" class="shrink-0" />
                  登出
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <main class="relative z-10 max-w-7xl mx-auto px-4 py-6">

      <!-- Search & Filter bar -->
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

        <!-- More filters button -->
        <div v-if="auth.user" class="relative ml-auto">
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
                  v-for="w in ['晴天','多雲時晴','多雲','陰天','小雨','雨天','大雨','雷陣雨','起霧','下雪']" :key="w"
                  class="px-2.5 py-1 rounded-full text-xs font-body transition-colors duration-150 cursor-pointer border"
                  :style="filterWeather === w
                    ? 'background: var(--c-primary); color: var(--c-base); border-color: var(--c-primary);'
                    : 'background: transparent; color: var(--c-inkMuted); border-color: var(--c-border);'"
                  @click="filterWeather = filterWeather === w ? '' : w"
                >{{ w }}</button>
              </div>

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
              <template v-if="store.availableTags.length">
                <div class="flex items-center justify-between mb-2.5">
                  <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted">標籤</p>
                  <button
                    class="text-inkMuted hover:text-primary transition-colors cursor-pointer"
                    :title="filterTags.length === store.availableTags.length ? '取消全部' : '選取全部'"
                    @click="filterTags = filterTags.length === store.availableTags.length ? [] : [...store.availableTags]"
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

      <!-- Result count hint -->
      <p v-if="hasActiveFilters" class="text-xs font-body text-inkMuted mb-4 tracking-wide">
        找到 <span class="text-primary font-semibold">{{ filteredPosts.length }}</span> 筆記錄
      </p>

      <!-- Loading skeleton -->
      <div v-if="store.loading" class="columns-1 sm:columns-2 xl:columns-4 gap-4">
        <div
          v-for="i in 8" :key="i"
          class="break-inside-avoid mb-4 card-aged animate-pulse"
          :style="{ height: `${180 + (i % 3) * 80}px` }"
        />
      </div>

      <div v-else-if="store.error" class="text-center py-24 font-body text-red-400">
        {{ store.error }}
      </div>

      <!-- No posts at all -->
      <div v-else-if="store.posts.length === 0" class="flex flex-col items-center justify-center py-32">
        <div class="card-aged p-10 text-center max-w-sm">
          <MapIcon :size="44" class="mx-auto mb-4 text-primary opacity-40" />
          <p class="font-heading text-2xl text-ink mb-2">記錄尚未開始</p>
          <p class="text-sm mb-6 font-body italic text-inkMuted">每段旅程都值得被記錄</p>
          <router-link v-if="auth.user" to="/create" class="btn-cta inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg cursor-pointer">
            <PlusIcon :size="15" />
            新增第一筆
          </router-link>
          <button v-else class="btn-cta inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg cursor-pointer" @click="auth.login()">
            <LogInIcon :size="15" />
            登入以開始記錄
          </button>
        </div>
      </div>

      <!-- No results after filtering -->
      <div v-else-if="filteredPosts.length === 0" class="flex flex-col items-center justify-center py-24">
        <div class="card-aged p-10 text-center max-w-sm">
          <SearchIcon :size="36" class="mx-auto mb-4 text-primary opacity-30" />
          <p class="font-heading text-xl text-ink mb-2">沒有符合的記錄</p>
          <p class="text-sm mb-5 font-body italic text-inkMuted">嘗試調整篩選條件</p>
          <button class="btn-cta inline-flex items-center gap-2 font-semibold px-5 py-2 rounded-lg cursor-pointer text-sm" @click="clearFilters">
            <XIcon :size="13" /> 清除篩選
          </button>
        </div>
      </div>

      <!-- Logged in: two sections (已公開 / 草稿) -->
      <template v-else-if="auth.user">
        <template v-if="filteredPublicPosts.length > 0">
          <div class="flex items-center gap-3 mb-4">
            <span class="font-heading text-xs uppercase tracking-[0.2em] text-inkMuted opacity-60">已公開</span>
            <span class="flex-1 border-t" style="border-color: var(--c-border);"></span>
            <span class="font-mono text-[10px] text-inkMuted opacity-40">{{ filteredPublicPosts.length }}</span>
          </div>
          <WaterfallList :posts="filteredPublicPosts" class="mb-10" />
        </template>
        <template v-if="filteredDraftPosts.length > 0">
          <div class="flex items-center gap-3 mb-4">
            <span class="font-heading text-xs uppercase tracking-[0.2em] text-inkMuted opacity-60">草稿</span>
            <span class="flex-1 border-t" style="border-color: var(--c-border);"></span>
            <span class="font-mono text-[10px] text-inkMuted opacity-40">{{ filteredDraftPosts.length }}</span>
          </div>
          <WaterfallList :posts="filteredDraftPosts" />
        </template>
      </template>

      <!-- Not logged in: public posts only, no section headers -->
      <WaterfallList v-else :posts="filteredPosts" />
    </main>
  </div>

  <!-- Logout confirmation modal -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="showLogoutModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: color-mix(in srgb, var(--c-base) 60%, transparent); backdrop-filter: blur(4px);"
        @click.self="showLogoutModal = false"
        @keydown.esc="showLogoutModal = false"
      >
        <div class="card-aged rounded-xl shadow-xl p-6 w-full max-w-xs space-y-5">
          <div class="space-y-1">
            <p class="font-heading text-base text-ink tracking-wide">確認登出</p>
            <p class="font-body text-sm text-inkMuted">確定要登出帳號嗎？</p>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              class="card-aged px-4 py-2 rounded-lg text-sm font-body text-inkMuted hover:text-ink cursor-pointer transition-colors duration-150"
              @click="showLogoutModal = false"
            >取消</button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-body cursor-pointer transition-colors duration-150"
              style="background: var(--c-primary); color: var(--c-base);"
              @click="doLogout"
            >登出</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Compass as CompassIcon, Plus as PlusIcon, Map as MapIcon,
  Search as SearchIcon, X as XIcon,
  Library as LibraryIcon, Route as RouteIcon,
  LogIn as LogInIcon, LogOut as LogOutIcon,
  Settings as SettingsIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  Square as SquareIcon, CheckSquare as CheckSquareIcon,
} from 'lucide-vue-next'
import WaterfallList from '../components/WaterfallList.vue'
import DateRangePicker from '../components/DateRangePicker.vue'
import { usePostStore } from '../stores/postStore'
import { useAuthStore } from '../stores/authStore'
import { useProfileStore } from '../stores/profileStore'
import type { Post } from '../types'

const store   = usePostStore()
const auth    = useAuthStore()
const profile = useProfileStore()
const showUserMenu        = ref(false)
const showLogoutModal     = ref(false)
const avatarDropdownRoot  = ref<HTMLElement | null>(null)

function onDocumentClick(e: MouseEvent) {
  if (!avatarDropdownRoot.value?.contains(e.target as Node)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  store.fetchPosts()
  store.fetchTags()
  document.addEventListener('mousedown', onDocumentClick)
})
onUnmounted(() => document.removeEventListener('mousedown', onDocumentClick))

const filterWeather    = ref('')
const filterDays       = ref('')
const filterDateStart  = ref('')
const filterDateEnd    = ref('')
const filterStars      = ref<number[]>([])
const filterTags       = ref<string[]>([])
const showFilterPanel  = ref(false)

const activeFilterCount = computed(() =>
  filterStars.value.length + filterTags.value.length + (filterWeather.value ? 1 : 0)
)

watch(() => profile.difficultyMax, (max) => {
  filterStars.value = filterStars.value.filter(n => n <= max)
})

const hasActiveFilters = computed(() =>
  !!(filterWeather.value || filterDays.value || filterDateStart.value || filterDateEnd.value ||
     filterStars.value.length || filterTags.value.length)
)

function toggleStars(n: number) {
  const i = filterStars.value.indexOf(n)
  filterStars.value = i === -1 ? [...filterStars.value, n] : filterStars.value.filter(s => s !== n)
}

function toggleTag(tag: string) {
  const i = filterTags.value.indexOf(tag)
  filterTags.value = i === -1 ? [...filterTags.value, tag] : filterTags.value.filter(t => t !== tag)
}

function confirmLogout() {
  showUserMenu.value  = false
  showLogoutModal.value = true
}

function doLogout() {
  auth.logout()
  window.location.reload()
}

function clearFilters() {
  filterWeather.value   = ''
  filterDays.value      = ''
  filterDateStart.value = ''
  filterDateEnd.value   = ''
  filterStars.value     = []
  filterTags.value      = []
}

function calcDays(post: Post): number {
  if (!post.dateStart || !post.dateEnd) return 1
  const diff = Math.round(
    (new Date(post.dateEnd).getTime() - new Date(post.dateStart).getTime()) / 86400000
  )
  return Math.max(1, diff + 1)
}

const filteredPosts = computed(() => {
  return store.posts.filter(post => {
    if (filterWeather.value && post.weather !== filterWeather.value) return false

    if (filterStars.value.length && !filterStars.value.includes(post.difficultyStars ?? 0)) return false

    if (filterTags.value.length && !filterTags.value.some(t => post.tags?.includes(t))) return false

    if (filterDays.value) {
      const d = calcDays(post)
      if (filterDays.value === '1'   && d !== 1)          return false
      if (filterDays.value === '2-3' && (d < 2 || d > 3)) return false
      if (filterDays.value === '4-7' && (d < 4 || d > 7)) return false
      if (filterDays.value === '7+'  && d <= 7)            return false
    }

    if (filterDateStart.value || filterDateEnd.value) {
      const d = (post.dateStart ?? post.created_at ?? '').slice(0, 10)
      if (filterDateStart.value && d < filterDateStart.value) return false
      if (filterDateEnd.value   && d > filterDateEnd.value)   return false
    }

    return true
  })
})

const filteredPublicPosts = computed(() => filteredPosts.value.filter(p => p.isPublic))
const filteredDraftPosts  = computed(() => filteredPosts.value.filter(p => !p.isPublic))
</script>

<style scoped>
/* Expanding icon button */
.nav-icon-btn {
  display: flex;
  align-items: center;
  gap: 0;
  height: 36px;
  max-width: 36px;
  padding: 0 9px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  color: #FCFCFC;
  background: color-mix(in srgb, #FFD166 30%, transparent);
  border: 1px solid color-mix(in srgb, #FFD166 50%, transparent);
  transition: max-width 0.25s ease, gap 0.25s ease, background 0.15s, color 0.15s, padding 0.25s ease;
  text-decoration: none;
  white-space: nowrap;
}
.nav-icon-btn:hover {
  max-width: 120px;
  gap: 6px;
  padding: 0 12px;
  background: #FFD166;
  color: #26547C;
}
.nav-icon-btn__icon {
  flex-shrink: 0;
}
.nav-icon-btn__label {
  font-size: 13px;
  font-family: var(--font-body, sans-serif);
  font-weight: 600;
  overflow: hidden;
  opacity: 0;
  max-width: 0;
  transition: opacity 0.15s ease 0.05s, max-width 0.25s ease;
}
.nav-icon-btn:hover .nav-icon-btn__label {
  opacity: 1;
  max-width: 80px;
}

/* Avatar button */
.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--c-primary);
  transition: box-shadow 0.15s, opacity 0.15s;
}
.avatar-btn:hover { opacity: 0.88; }
.avatar-btn--open {
  box-shadow: 0 0 0 2px var(--c-base), 0 0 0 4px color-mix(in srgb, var(--c-primary) 50%, transparent);
}

/* Dropdown panel */
.avatar-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 176px;
  border-radius: 14px;
  padding: 6px;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  z-index: 50;
  transform-origin: top right;
}

/* Menu rows */
.menu-row {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-family: var(--font-body, sans-serif);
  color: var(--c-inkMuted);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  text-decoration: none;
}
.menu-row:hover {
  background: color-mix(in srgb, var(--c-primary) 14%, transparent);
  color: var(--c-primary);
}
.menu-row--danger:hover {
  background: color-mix(in srgb, #e07070 14%, transparent);
  color: #e07070;
}

/* Dropdown open/close animation */
.dropdown-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: scale(0.95) translateY(-4px); }

.filter-panel-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.filter-panel-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.filter-panel-enter-from, .filter-panel-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to    { opacity: 0; }

/* ── Search bar ───────────────────────────────────────── */
.search-bar {
  align-items: center;
}


/* ── Filter selects ───────────────────────────────────── */
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

/* ── Clear button ─────────────────────────────────────── */
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
</style>
