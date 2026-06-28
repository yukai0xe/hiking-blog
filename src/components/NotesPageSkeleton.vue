<template>
  <div class="animate-pulse">

    <!-- Ungrouped section header -->
    <div class="flex items-center justify-between px-4 sm:px-0 mb-3">
      <div class="skel h-3 w-14 rounded" />
      <div class="skel h-7 w-20 rounded-lg" />
    </div>

    <!-- 2 ungrouped card skeletons -->
    <div class="space-y-2 mb-8">
      <SkeletonCard v-for="i in 2" :key="`u${i}`" />
    </div>

    <!-- Divider -->
    <div class="mb-8" style="border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);" />

    <!-- Group 1 -->
    <div class="flex items-center gap-2 px-4 sm:px-0 mb-3">
      <div class="skel h-3 w-24 rounded flex-1 max-w-[96px]" />
      <div class="skel h-7 h-7 w-7 rounded" />
      <div class="skel h-7 h-7 w-7 rounded" />
      <div class="skel h-7 h-7 w-7 rounded" />
      <div class="skel h-7 w-20 rounded-lg" />
    </div>
    <div class="space-y-2 mb-8">
      <SkeletonCard v-for="i in 3" :key="`g1${i}`" />
    </div>

    <!-- Group 2 -->
    <div class="flex items-center gap-2 px-4 sm:px-0 mb-3">
      <div class="skel h-3 w-16 rounded flex-1 max-w-[64px]" />
      <div class="skel h-7 w-7 rounded" />
      <div class="skel h-7 w-7 rounded" />
      <div class="skel h-7 w-7 rounded" />
      <div class="skel h-7 w-20 rounded-lg" />
    </div>
    <div class="space-y-2">
      <SkeletonCard v-for="i in 2" :key="`g2${i}`" />
    </div>

  </div>
</template>

<script setup lang="ts">
import SkeletonCard from './NotesLinkCardSkeleton.vue'
</script>

<style scoped>
.skel {
  background: color-mix(in srgb, var(--c-border) 80%, transparent);
  border-radius: 4px;
}
</style>
