<template>
  <div ref="rootRef" class="relative">
    <button
      @click="showMenu = !showMenu"
      class="avatar-btn"
      :class="{ 'avatar-btn--open': showMenu }"
    >
      <img
        v-if="auth.user!.avatarUrl"
        :src="auth.user!.avatarUrl"
        class="w-full h-full object-cover"
        alt="avatar"
      />
      <span v-else class="font-heading text-sm font-bold" style="color: var(--c-base);">
        {{ auth.user!.name?.[0]?.toUpperCase() ?? '?' }}
      </span>
    </button>

    <Transition name="dropdown">
      <div v-if="showMenu" class="avatar-menu">
        <!-- User info -->
        <div class="px-3 py-2.5 mb-1" style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent);">
          <p class="text-xs font-body font-semibold text-ink truncate">{{ auth.user!.name || '使用者' }}</p>
          <p class="text-[11px] font-body text-inkMuted truncate">{{ auth.user!.email }}</p>
        </div>

        <!-- Navigation -->
        <router-link to="/gpx-library" @click="showMenu = false" class="menu-row">
          <RouteIcon :size="14" class="shrink-0" />
          GPX 收藏
        </router-link>
        <router-link to="/gear-library" @click="showMenu = false" class="menu-row">
          <LibraryIcon :size="14" class="shrink-0" />
          裝備庫
        </router-link>
        <router-link to="/notes" @click="showMenu = false" class="menu-row">
          <BookmarkIcon :size="14" class="shrink-0" />
          筆記
        </router-link>

        <div style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent); margin: 4px 0;" />
        <router-link to="/profile" @click="showMenu = false" class="menu-row">
          <SettingsIcon :size="14" class="shrink-0" />
          個人設定
        </router-link>

        <div style="border-top: 1px solid color-mix(in srgb, var(--c-border) 50%, transparent); margin: 4px 0;" />
        <button @click="requestLogout" class="menu-row menu-row--danger w-full text-left">
          <LogOutIcon :size="14" class="shrink-0" />
          登出
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Route as RouteIcon, Library as LibraryIcon, Bookmark as BookmarkIcon, Settings as SettingsIcon, LogOut as LogOutIcon } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'

const emit = defineEmits<{ 'logout-request': [] }>()

const auth     = useAuthStore()
const showMenu = ref(false)
const rootRef  = ref<HTMLElement | null>(null)

function onDocumentClick(e: MouseEvent) {
  if (!rootRef.value?.contains(e.target as Node)) {
    showMenu.value = false
  }
}

function requestLogout() {
  showMenu.value = false
  emit('logout-request')
}

onMounted(()   => document.addEventListener('mousedown', onDocumentClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocumentClick))
</script>

<style scoped>
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

.dropdown-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: scale(0.95) translateY(-4px); }
</style>
