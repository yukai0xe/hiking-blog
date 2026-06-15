<template>
  <img
    class="topo-bg"
    :src="bg"
    alt=""
    aria-hidden="true"
  />
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import bg1 from './assets/typography-bg.svg'
import bg2 from './assets/typography-bg-2.svg'
import bg3 from './assets/typography-bg-3.svg'
import bg4 from './assets/typography-bg-4.svg'
import bg5 from './assets/typography-bg-5.svg'
import { useAuthStore } from './stores/authStore'

const BACKGROUNDS = [bg1, bg2, bg3, bg4, bg5]
const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]

const auth = useAuthStore()
onMounted(() => auth.init())
</script>
