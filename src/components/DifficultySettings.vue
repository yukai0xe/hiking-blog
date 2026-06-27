<template>
  <section class="card-aged p-6">
    <h2 class="font-heading text-base text-ink tracking-wide mb-1">登山難度設定</h2>
    <p class="text-xs font-body text-inkMuted mb-5">設定難度星等上限，並為每個等級加上說明</p>

    <!-- Max stepper -->
    <div class="flex items-center gap-4 mb-6 pb-5"
         style="border-bottom: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);">
      <span class="text-sm font-body text-inkMuted">最高星等</span>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer font-mono text-base transition-colors duration-100"
          style="border: 1px solid var(--c-border);"
          :style="profile.difficultyMax <= 1 ? { opacity: '0.3', cursor: 'not-allowed' } : {}"
          @click="profile.setDifficultyMax(profile.difficultyMax - 1)"
          :disabled="profile.difficultyMax <= 1"
        >−</button>
        <span class="font-mono text-lg text-ink w-8 text-center">{{ profile.difficultyMax }}</span>
        <button
          type="button"
          class="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer font-mono text-base transition-colors duration-100"
          style="border: 1px solid var(--c-border);"
          @click="profile.setDifficultyMax(profile.difficultyMax + 1)"
        >+</button>
      </div>
      <span class="text-primary font-mono ml-1" style="font-size:14px;letter-spacing:-1px;">
        {{ '★'.repeat(Math.min(profile.difficultyMax, 10)) }}{{ profile.difficultyMax > 10 ? `…(×${profile.difficultyMax})` : '' }}
      </span>
    </div>

    <!-- Per-level label editors -->
    <div class="space-y-3">
      <div
        v-for="n in profile.difficultyMax"
        :key="n"
        class="flex items-center gap-3"
      >
        <span
          class="font-mono shrink-0 text-primary"
          style="font-size: 12px; letter-spacing: -2px; min-width: 68px;"
        >
          <template v-if="n <= 10">{{ '★'.repeat(n) }}{{ '☆'.repeat(Math.min(profile.difficultyMax, 10) - n) }}</template>
          <template v-else>★×{{ n }}</template>
        </span>
        <input
          :value="profile.difficultyLabels[n - 1] ?? ''"
          @input="profile.setDifficultyLabel(n - 1, ($event.target as HTMLInputElement).value)"
          type="text"
          class="input-field text-sm flex-1"
          :placeholder="`第 ${n} 級說明（選填）`"
        />
      </div>
    </div>

    <!-- Preview -->
    <div v-if="profile.difficultyMax > 0" class="mt-5 pt-4"
         style="border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);">
      <p class="text-[10px] font-body uppercase tracking-widest text-inkMuted mb-3">預覽</p>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="n in profile.difficultyMax"
          :key="n"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style="background: color-mix(in srgb, var(--c-primary) 8%, transparent); border: 1px solid color-mix(in srgb, var(--c-primary) 20%, transparent);"
        >
          <span class="text-primary font-mono" style="font-size:11px;letter-spacing:-1px;">
            <template v-if="n <= 10">{{ '★'.repeat(n) }}</template>
            <template v-else>★×{{ n }}</template>
          </span>
          <span v-if="profile.difficultyLabels[n - 1]" class="text-xs font-body text-inkMuted">
            {{ profile.difficultyLabels[n - 1] }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useProfileStore } from '../stores/profileStore'

const profile = useProfileStore()
</script>
