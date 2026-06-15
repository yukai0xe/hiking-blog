<template>
  <div class="min-h-screen textured-bg vignette flex items-center justify-center">
    <div class="card-aged px-10 py-8 text-center max-w-sm">
      <p v-if="error" class="font-body text-sm" style="color: #f87171;">登入失敗：{{ error }}</p>
      <p v-else class="font-body text-sm text-inkMuted">登入中，請稍候…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const error  = ref<string | null>(null)

onMounted(async () => {
  const code  = route.query.code as string | undefined
  // State was stored in sessionStorage before the OAuth redirect — no need to pass it through the URL.
  const state = sessionStorage.getItem('oauth_state') ?? ''
  if (!code) {
    error.value = '缺少授權參數'
    return
  }
  try {
    await auth.handleCallback(code, state)
    router.replace('/')
  } catch (e) {
    error.value = (e as Error).message
  }
})
</script>
