<template>
  <div class="min-h-screen textured-bg vignette">
    <AppNavbar />

    <main class="relative z-10 max-w-7xl mx-auto px-0 sm:px-4 py-6">
      <PostFilterBar :is-logged-in="!!auth.user" />

      <!-- Result count hint -->
      <p v-if="hasActiveFilters" class="text-xs font-body text-inkMuted mb-4 tracking-wide px-4 sm:px-0">
        找到 <span class="text-primary font-semibold">{{ filteredPosts.length }}</span> 筆記錄
      </p>

      <!-- Empty / loading / error states -->
      <PostEmptyState
        v-if="store.loading || store.error || !store.posts.length || !filteredPosts.length"
        :loading="store.loading"
        :error="store.error ?? ''"
        :total-posts="store.posts.length"
        :is-logged-in="!!auth.user"
        @login="auth.login()"
        @clear-filters="clearFilters"
      />

      <!-- Logged in: public + draft sections -->
      <template v-else-if="auth.user">
        <template v-if="filteredPublicPosts.length > 0">
          <div class="flex items-center gap-3 mb-4 px-4 sm:px-0">
            <span class="font-heading text-xs uppercase tracking-[0.2em] text-inkMuted opacity-60">已公開</span>
            <span class="flex-1 border-t" style="border-color: var(--c-border);"></span>
            <span class="font-mono text-[10px] text-inkMuted opacity-40">{{ filteredPublicPosts.length }}</span>
          </div>
          <WaterfallList :posts="filteredPublicPosts" class="mb-10" />
        </template>
        <template v-if="filteredDraftPosts.length > 0">
          <div class="flex items-center gap-3 mb-4 px-4 sm:px-0">
            <span class="font-heading text-xs uppercase tracking-[0.2em] text-inkMuted opacity-60">草稿</span>
            <span class="flex-1 border-t" style="border-color: var(--c-border);"></span>
            <span class="font-mono text-[10px] text-inkMuted opacity-40">{{ filteredDraftPosts.length }}</span>
          </div>
          <WaterfallList :posts="filteredDraftPosts" />
        </template>
      </template>

      <!-- Not logged in: all public posts -->
      <WaterfallList v-else :posts="filteredPosts" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppNavbar from '../components/AppNavbar.vue'
import PostFilterBar from '../components/PostFilterBar.vue'
import PostEmptyState from '../components/PostEmptyState.vue'
import WaterfallList from '../components/WaterfallList.vue'
import { usePostStore } from '../stores/postStore'
import { useAuthStore } from '../stores/authStore'
import { usePostFilter } from '../composables/usePostFilter'

const store = usePostStore()
const auth  = useAuthStore()

const { filteredPosts, filteredPublicPosts, filteredDraftPosts, hasActiveFilters, clearFilters } = usePostFilter()

onMounted(() => {
  store.fetchPosts()
  store.fetchTags()
})
</script>
