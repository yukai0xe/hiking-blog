<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="columns-1 sm:columns-2 xl:columns-4 gap-4">
    <div
      v-for="i in 8" :key="i"
      class="break-inside-avoid mb-4 card-aged animate-pulse"
      :style="{ height: `${180 + (i % 3) * 80}px` }"
    />
  </div>

  <!-- Error -->
  <div v-else-if="error" class="text-center py-24 font-body text-red-400">
    {{ error }}
  </div>

  <!-- No posts at all -->
  <div v-else-if="totalPosts === 0" class="flex flex-col items-center justify-center py-32">
    <div class="card-aged p-10 text-center max-w-sm">
      <MapIcon :size="44" class="mx-auto mb-4 text-primary opacity-40" />
      <p class="font-heading text-2xl text-ink mb-2">記錄尚未開始</p>
      <p class="text-sm mb-6 font-body italic text-inkMuted">每段旅程都值得被記錄</p>
      <router-link
        v-if="isLoggedIn"
        to="/create"
        class="btn-cta inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg cursor-pointer"
      >
        <PlusIcon :size="15" />
        新增第一筆
      </router-link>
      <button
        v-else
        class="btn-cta inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg cursor-pointer"
        @click="emit('login')"
      >
        <LogInIcon :size="15" />
        登入以開始記錄
      </button>
    </div>
  </div>

  <!-- No results after filtering -->
  <div v-else class="flex flex-col items-center justify-center py-24">
    <div class="card-aged p-10 text-center max-w-sm">
      <SearchIcon :size="36" class="mx-auto mb-4 text-primary opacity-30" />
      <p class="font-heading text-xl text-ink mb-2">沒有符合的記錄</p>
      <p class="text-sm mb-5 font-body italic text-inkMuted">嘗試調整篩選條件</p>
      <button
        class="btn-cta inline-flex items-center gap-2 font-semibold px-5 py-2 rounded-lg cursor-pointer text-sm"
        @click="emit('clearFilters')"
      >
        <XIcon :size="13" /> 清除篩選
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Map as MapIcon, Plus as PlusIcon, Search as SearchIcon, X as XIcon, LogIn as LogInIcon } from 'lucide-vue-next'

defineProps<{
  loading: boolean
  error: string
  totalPosts: number
  isLoggedIn: boolean
}>()

const emit = defineEmits<{
  login: []
  clearFilters: []
}>()
</script>
