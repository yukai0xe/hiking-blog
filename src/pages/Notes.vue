<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 max-w-5xl mx-auto px-4">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-8">
        <button
          class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          @click="$router.push('/')" aria-label="返回"
        >
          <ArrowLeftIcon :size="17" />
        </button>
        <div class="flex-1">
          <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">Notes</p>
          <h1 class="font-heading text-xl font-bold text-ink">筆記</h1>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="card-aged p-10 text-center text-inkMuted font-body">
        <div class="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
        載入中…
      </div>

      <template v-else>

        <!-- Ungrouped links -->
        <section class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-heading text-sm uppercase tracking-widest text-inkMuted opacity-70">未分組</h2>
            <button
              class="flex items-center gap-1.5 text-xs font-body text-inkMuted hover:text-primary transition-colors cursor-pointer"
              @click="openAddLink(null)"
            >
              <PlusIcon :size="13" /> 新增連結
            </button>
          </div>
          <div v-if="ungroupedLinks.length > 0"
               class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <NoteLinkCard
              v-for="link in ungroupedLinks"
              :key="link.id"
              :link="link"
              @delete="store.deleteLink(link.id)"
            />
          </div>
          <p v-else class="text-xs font-body italic text-inkMuted">尚無未分組連結</p>
        </section>

        <div v-if="store.groups.length > 0"
             style="border-top: 1px solid color-mix(in srgb, var(--c-border) 40%, transparent);"
             class="mb-6" />

        <!-- Group sections -->
        <div class="space-y-4">
          <NoteGroupSection
            v-for="group in store.groups"
            :key="group.id"
            :group="group"
            :links="linksForGroup(group.id)"
            @add-link="openAddLink(group.id)"
            @edit-group="openEditGroup(group)"
            @delete-group="store.deleteGroup(group.id)"
            @delete-link="store.deleteLink($event)"
          />
        </div>

        <!-- New group button -->
        <button
          class="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl card-aged text-sm font-body text-inkMuted hover:text-primary transition-colors cursor-pointer"
          @click="openNewGroup"
        >
          <FolderPlusIcon :size="15" /> 新增分組
        </button>

      </template>
    </div>

    <!-- Modals -->
    <NoteAddLinkModal
      :open="addLinkOpen"
      :group-id="addLinkGroupId"
      @close="addLinkOpen = false"
      @added="addLinkOpen = false"
    />
    <NoteGroupEditModal
      :open="groupEditOpen"
      :group="groupEditTarget"
      @close="groupEditOpen = false"
      @saved="groupEditOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft as ArrowLeftIcon, Plus as PlusIcon, FolderPlus as FolderPlusIcon } from 'lucide-vue-next'
import { useNotesStore } from '../stores/notesStore'
import type { NoteGroup } from '../types'
import NoteLinkCard       from '../components/NoteLinkCard.vue'
import NoteGroupSection   from '../components/NoteGroupSection.vue'
import NoteAddLinkModal   from '../components/NoteAddLinkModal.vue'
import NoteGroupEditModal from '../components/NoteGroupEditModal.vue'

const store = useNotesStore()

onMounted(() => store.fetchNotes())

const ungroupedLinks = computed(() => store.links.filter(l => l.groupId === null))

function linksForGroup(groupId: string) {
  return store.links.filter(l => l.groupId === groupId)
}

const addLinkOpen    = ref(false)
const addLinkGroupId = ref<string | null>(null)

function openAddLink(groupId: string | null) {
  addLinkGroupId.value = groupId
  addLinkOpen.value    = true
}

const groupEditOpen   = ref(false)
const groupEditTarget = ref<NoteGroup | null>(null)

function openEditGroup(group: NoteGroup) {
  groupEditTarget.value = group
  groupEditOpen.value   = true
}

function openNewGroup() {
  groupEditTarget.value = null
  groupEditOpen.value   = true
}
</script>
