<template>
  <div class="tabs-wrap">

    <!-- Tab list: horizontal scroll on mobile, vertical sidebar on sm+ -->
    <div class="tabs-list" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tabs-btn"
        :class="{ 'tabs-btn--active': active === tab.key }"
        @click="$emit('update:active', tab.key)"
      >{{ tab.label }}</button>
    </div>

    <!-- Content -->
    <div class="tabs-content">
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

<style scoped>
/* ── Mobile: column layout, horizontal scroll tab bar ──── */
.tabs-wrap {
  display: flex;
  flex-direction: column;
}

.tabs-list {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
  border-bottom: 1px solid var(--c-border);
  padding: 0 4px;
}
.tabs-list::-webkit-scrollbar { display: none; }

.tabs-btn {
  position: relative;
  padding: 10px 14px;
  font-family: var(--font-body, sans-serif);
  font-size: 14px;
  color: var(--c-inkMuted);
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 0.02em;
  transition: color 0.15s;
  background: transparent;
  border: none;
}
.tabs-btn:hover { color: var(--c-ink); }
.tabs-btn--active {
  color: var(--c-primary);
  font-weight: 600;
}

/* Mobile active indicator: bottom underline */
.tabs-btn--active::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 8px; right: 8px;
  height: 2px;
  border-radius: 1px;
  background: var(--c-primary);
}

.tabs-content {
  flex: 1;
  min-width: 0;
  padding: 20px 16px 0;
}

/* ── sm+ (≥ 640px): row layout, vertical sidebar ─────── */
@media (min-width: 640px) {
  .tabs-wrap { flex-direction: row; }

  .tabs-list {
    flex-direction: column;
    flex-shrink: 0;
    width: 88px;
    overflow-x: visible;
    border-bottom: none;
    border-right: 1px solid var(--c-border);
    padding: 4px 0 0;
  }

  .tabs-btn {
    text-align: left;
    padding: 12px 16px;
  }

  /* Desktop active indicator: right-side bar */
  .tabs-btn--active::after {
    bottom: auto;
    left: auto;
    right: -1px;
    top: 4px; bottom: 4px;
    width: 2px;
    height: auto;
    border-radius: 1px;
  }

  .tabs-content {
    padding: 0 0 0 24px;
  }
}
</style>
