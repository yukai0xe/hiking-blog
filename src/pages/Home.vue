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
          <button
            class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
            @click="theme.toggle()"
            :aria-label="theme.isDark ? '切換亮色模式' : '切換暗色模式'"
          >
            <SunIcon v-if="theme.isDark" :size="17" />
            <MoonIcon v-else :size="17" />
          </button>
          <router-link
            v-if="auth.user"
            to="/gpx-library"
            class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          >
            <RouteIcon :size="15" />
            GPX 收藏
          </router-link>
          <router-link
            v-if="auth.user"
            to="/gear-library"
            class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          >
            <LibraryIcon :size="15" />
            裝備庫
          </router-link>
          <router-link v-if="auth.user" to="/create" class="btn-cta flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
            <PlusIcon :size="15" />
            新增記錄
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
          <div v-else class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              class="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
              style="background: var(--c-primary);"
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

            <div
              v-if="showUserMenu"
              class="absolute right-0 top-11 card-aged rounded-xl shadow-xl p-2 z-50"
              style="min-width: 10rem;"
            >
              <p class="text-xs font-body px-3 py-1 truncate text-inkMuted">{{ auth.user.email }}</p>
              <button
                @click="confirmLogout"
                class="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-body rounded-lg text-inkMuted hover:text-ink transition-colors duration-200"
              >
                <LogOutIcon :size="13" />
                登出
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="relative z-10 max-w-7xl mx-auto px-4 py-6">

      <!-- Search & Filter bar -->
      <div class="search-bar card-aged p-3 mb-6 flex flex-wrap gap-2">

        <!-- Title search -->
        <div class="search-input-wrap flex-1">
          <SearchIcon :size="14" class="search-icon" />
          <input
            v-model="searchTitle"
            type="text"
            placeholder="搜尋標題…"
            class="search-input"
          />
          <button v-if="searchTitle" class="search-clear" @click="searchTitle = ''" aria-label="清除">
            <XIcon :size="12" />
          </button>
        </div>

        <!-- Weather -->
        <select v-model="filterWeather" class="filter-select">
          <option value="">所有天氣</option>
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

        <!-- Difficulty -->
        <select v-model.number="filterDifficulty" class="filter-select">
          <option :value="0">所有難度</option>
          <option :value="1">★☆☆☆☆</option>
          <option :value="2">★★☆☆☆</option>
          <option :value="3">★★★☆☆</option>
          <option :value="4">★★★★☆</option>
          <option :value="5">★★★★★</option>
        </select>

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

        <!-- Clear all -->
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
import { ref, computed, onMounted } from 'vue'
import {
  Compass as CompassIcon, Plus as PlusIcon, Map as MapIcon,
  Sun as SunIcon, Moon as MoonIcon, Search as SearchIcon, X as XIcon,
  Library as LibraryIcon, Route as RouteIcon,
  LogIn as LogInIcon, LogOut as LogOutIcon,
} from 'lucide-vue-next'
import WaterfallList from '../components/WaterfallList.vue'
import DateRangePicker from '../components/DateRangePicker.vue'
import { usePostStore } from '../stores/postStore'
import { useThemeStore } from '../stores/themeStore'
import { useAuthStore } from '../stores/authStore'
import type { Post } from '../types'

const store = usePostStore()
const theme = useThemeStore()
const auth = useAuthStore()
const showUserMenu     = ref(false)
const showLogoutModal  = ref(false)
onMounted(() => store.fetchPosts())

const searchTitle    = ref('')
const filterWeather    = ref('')
const filterDays       = ref('')
const filterDifficulty = ref(0)
const filterDateStart = ref('')
const filterDateEnd   = ref('')

const hasActiveFilters = computed(() =>
  !!(searchTitle.value || filterWeather.value || filterDays.value || filterDifficulty.value || filterDateStart.value || filterDateEnd.value)
)

function confirmLogout() {
  showUserMenu.value  = false
  showLogoutModal.value = true
}

function doLogout() {
  auth.logout()
  window.location.reload()
}

function clearFilters() {
  searchTitle.value      = ''
  filterWeather.value    = ''
  filterDays.value       = ''
  filterDifficulty.value = 0
  filterDateStart.value  = ''
  filterDateEnd.value    = ''
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
    if (searchTitle.value && !post.title.toLowerCase().includes(searchTitle.value.toLowerCase()))
      return false

    if (filterWeather.value && post.weather !== filterWeather.value)
      return false

    if (filterDifficulty.value && post.difficultyStars !== filterDifficulty.value)
      return false

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
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to    { opacity: 0; }

/* ── Search bar ───────────────────────────────────────── */
.search-bar {
  align-items: center;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 180px;
}
.search-icon {
  position: absolute;
  left: 10px;
  color: var(--c-inkMuted);
  pointer-events: none;
  flex-shrink: 0;
}
.search-input {
  width: 100%;
  padding: 7px 30px 7px 30px;
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  font-family: Inter, sans-serif;
  font-size: 13px;
  color: var(--c-ink);
  outline: none;
  transition: border-color 0.15s ease;
}
.search-input::placeholder { color: var(--c-inkMuted); opacity: 0.6; }
.search-input:focus { border-color: var(--c-primary); }

.search-clear {
  position: absolute;
  right: 8px;
  color: var(--c-inkMuted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s;
}
.search-clear:hover { color: var(--c-ink); }

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
