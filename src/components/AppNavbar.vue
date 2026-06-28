<template>
  <header class="sticky top-0 z-20 sm:px-4 sm:pt-4 sm:pb-2">
    <div
      class="max-w-7xl mx-auto card-aged px-5 py-3 flex items-center justify-between navbar-inner"
      style="backdrop-filter: blur(10px);"
    >
      <div class="flex items-center gap-2.5">
        <CompassIcon :size="20" class="text-primary" />
        <span class="font-heading text-lg font-semibold text-ink tracking-wide">Expedition Log</span>
      </div>
      <div class="flex items-center gap-2">
        <router-link v-if="auth.user" to="/create" class="nav-icon-btn" aria-label="新增記錄">
          <PlusIcon :size="17" class="nav-icon-btn__icon" />
          <span class="nav-icon-btn__label">新增記錄</span>
        </router-link>

        <button
          v-if="!auth.user"
          @click="auth.login()"
          class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
        >
          <LogInIcon :size="15" />
          登入
        </button>

        <UserAvatarMenu v-else @logout-request="showLogoutModal = true" />
      </div>
    </div>
  </header>

  <LogoutModal v-model="showLogoutModal" @confirm="doLogout" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Compass as CompassIcon, Plus as PlusIcon, LogIn as LogInIcon } from 'lucide-vue-next'
import UserAvatarMenu from './UserAvatarMenu.vue'
import LogoutModal from './LogoutModal.vue'
import { useAuthStore } from '../stores/authStore'

const auth            = useAuthStore()
const showLogoutModal = ref(false)

function doLogout() {
  auth.logout()
  window.location.reload()
}
</script>

<style scoped>
@media (max-width: 639px) {
  .navbar-inner {
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
  }
}

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
</style>
