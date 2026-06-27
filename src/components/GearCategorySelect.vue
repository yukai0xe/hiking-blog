<template>
  <div>
    <select v-model="model" class="input-field text-sm font-body">
      <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
    </select>
    <template v-if="addingCat">
      <div class="flex items-center gap-1.5 mt-1.5">
        <input
          v-model="newCatName"
          type="text"
          class="input-field text-xs flex-1"
          placeholder="新類別名稱"
          @keydown.enter="confirmAdd"
          @keydown.escape="addingCat = false; newCatName = ''"
        />
        <button
          type="button"
          class="w-7 h-7 rounded-lg flex items-center justify-center btn-cta cursor-pointer disabled:opacity-40"
          :disabled="!newCatName.trim() || savingCat"
          @click="confirmAdd"
        >
          <span v-if="savingCat" class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          <CheckIcon v-else :size="11" />
        </button>
        <button
          type="button"
          class="w-7 h-7 rounded-lg flex items-center justify-center card-aged text-inkMuted hover:text-ink transition-colors cursor-pointer"
          @click="addingCat = false; newCatName = ''"
        >
          <XIcon :size="11" />
        </button>
      </div>
    </template>
    <button
      v-else
      type="button"
      class="mt-1.5 flex items-center gap-1 text-[11px] font-body text-inkMuted hover:text-primary transition-colors cursor-pointer"
      @click="addingCat = true"
    >
      <PlusIcon :size="10" /> 新增類別
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus as PlusIcon, Check as CheckIcon, X as XIcon } from 'lucide-vue-next'

const props = defineProps<{
  categories: string[]
  addCategory: (name: string) => Promise<void>
}>()

const model = defineModel<string>({ required: true })

const addingCat  = ref(false)
const newCatName = ref('')
const savingCat  = ref(false)

async function confirmAdd() {
  const name = newCatName.value.trim()
  if (!name || savingCat.value) return
  savingCat.value = true
  try {
    await props.addCategory(name)
    model.value  = name
    addingCat.value  = false
    newCatName.value = ''
  } catch {
    // keep input open on error
  } finally {
    savingCat.value = false
  }
}
</script>
