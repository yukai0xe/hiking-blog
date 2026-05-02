<template>
  <div class="flex gap-0">

    <!-- Left tab list -->
    <div
      class="flex flex-col shrink-0 pt-1"
      style="width: 88px; border-right: 1px solid var(--c-border);"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="relative text-left px-4 py-3 text-sm font-body tracking-wide cursor-pointer transition-all duration-200"
        :class="active === tab.key ? 'font-semibold' : 'text-inkMuted hover:text-ink'"
        :style="active === tab.key
          ? 'color: var(--c-primary);'
          : ''"
        @click="$emit('update:active', tab.key)"
      >
        <!-- Active indicator line -->
        <span
          v-if="active === tab.key"
          class="absolute right-0 top-1 bottom-1 w-0.5 rounded-full"
          style="background: var(--c-primary); margin-right: -1px;"
        />
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 pl-6">
      <slot :active="active" />
    </div>

  </div>
</template>

<script setup lang="ts">
defineProps<{
  tabs: { key: string; label: string }[]
  active: string
}>()
defineEmits<{ 'update:active': [key: string] }>()
</script>
