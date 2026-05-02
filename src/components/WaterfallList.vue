<template>
  <div class="columns-1 sm:columns-2 xl:columns-4 gap-4">
    <div v-for="post in posts" :key="post.id" class="break-inside-avoid mb-4">
      <PostCard :post="post" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PostCard from './PostCard.vue'
import type { Post } from '../types'

defineProps<{ posts: Post[] }>()
</script>
