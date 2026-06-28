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
        <button
          class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
          aria-label="垃圾桶"
          @click="trashOpen = true"
        >
          <Trash2Icon :size="15" />
        </button>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="card-aged p-10 text-center text-inkMuted font-body">
        <div class="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
        載入中…
      </div>

      <!-- Delete error -->
      <div v-if="deleteError"
        class="mb-4 px-4 py-2.5 rounded-lg flex items-center gap-2 font-body text-sm"
        style="background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.35); color: #e07070;"
      >
        <AlertCircleIcon :size="14" class="shrink-0" />
        {{ deleteError }}
      </div>

      <template v-else>

        <!-- Ungrouped links -->
        <section
          class="mb-6 rounded-xl p-3 -m-3 transition-colors duration-150"
          :style="ungroupedDragOver ? { background: 'color-mix(in srgb, var(--c-primary) 6%, transparent)', outline: '2px dashed color-mix(in srgb, var(--c-primary) 40%, transparent)' } : {}"
          @dragover.prevent="ungroupedDragOver = true"
          @dragleave="(e) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) ungroupedDragOver = false }"
          @drop.prevent="onDropUngrouped"
        >
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-heading text-sm uppercase tracking-widest text-inkMuted opacity-70">未分組</h2>
            <button
              class="btn-cta flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium cursor-pointer"
              @click="openAddLink(null)"
            >
              <PlusIcon :size="13" /> 新增連結
            </button>
          </div>
          <div v-if="ungroupedLinks.length > 0" class="space-y-2">
            <NoteLinkCard
              v-for="link in ungroupedLinks"
              :key="link.id"
              :link="link"
              @open-detail="openDetail(link)"
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
            @delete-group="handleDeleteGroup(group.id)"
            @open-detail-link="openDetail($event)"
            @move-link="handleMoveLink($event, group.id)"
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
    <ConfirmDialog
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      @confirm="onConfirmed"
      @close="confirmOpen = false"
    />
    <NoteTrashModal
      :open="trashOpen"
      @close="trashOpen = false"
    />
    <NoteLinkDetailModal
      :open="detailOpen"
      :link="detailLink"
      @close="detailOpen = false"
      @delete="handleDeleteFromDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft as ArrowLeftIcon, Plus as PlusIcon, FolderPlus as FolderPlusIcon, AlertCircle as AlertCircleIcon, Trash2 as Trash2Icon } from 'lucide-vue-next'
import { useNotesStore } from '../stores/notesStore'
import type { NoteGroup, NoteLink } from '../types'
import NoteLinkCard         from '../components/NoteLinkCard.vue'
import NoteGroupSection     from '../components/NoteGroupSection.vue'
import NoteAddLinkModal     from '../components/NoteAddLinkModal.vue'
import NoteGroupEditModal   from '../components/NoteGroupEditModal.vue'
import ConfirmDialog        from '../components/ConfirmDialog.vue'
import NoteTrashModal       from '../components/NoteTrashModal.vue'
import NoteLinkDetailModal  from '../components/NoteLinkDetailModal.vue'

const store = useNotesStore()

const deleteError       = ref<string | null>(null)
const ungroupedDragOver = ref(false)

const detailOpen = ref(false)
const detailLink = ref<NoteLink | null>(null)

function openDetail(link: NoteLink) {
  detailLink.value = link
  detailOpen.value = true
}

function handleDeleteFromDetail() {
  const link = detailLink.value
  if (!link) return
  detailOpen.value = false
  handleDeleteLink(link.id)
}

const trashOpen      = ref(false)
const confirmOpen    = ref(false)
const confirmTitle   = ref('')
const confirmMessage = ref('')
let   pendingAction: (() => Promise<void>) | null = null

function showConfirm(title: string, message: string, action: () => Promise<void>) {
  confirmTitle.value   = title
  confirmMessage.value = message
  pendingAction        = action
  confirmOpen.value    = true
}

async function onConfirmed() {
  confirmOpen.value = false
  if (pendingAction) {
    await pendingAction()
    pendingAction = null
  }
}

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

function handleDeleteLink(id: string) {
  showConfirm('刪除連結', '連結將移至垃圾桶，可從垃圾桶還原或永久刪除。', async () => {
    deleteError.value = null
    try { await store.deleteLink(id) }
    catch (e) { deleteError.value = (e as Error).message }
  })
}

async function handleMoveLink(id: string, groupId: string | null) {
  deleteError.value = null
  try { await store.moveLink(id, groupId) }
  catch (e) { deleteError.value = (e as Error).message }
}

function onDropUngrouped(e: DragEvent) {
  ungroupedDragOver.value = false
  const id = e.dataTransfer?.getData('text/plain')
  if (id) handleMoveLink(id, null)
}

function handleDeleteGroup(id: string) {
  showConfirm('刪除分組', '確定要刪除此分組嗎？分組內的連結不會被刪除，將移至未分組。', async () => {
    deleteError.value = null
    try { await store.deleteGroup(id) }
    catch (e) { deleteError.value = (e as Error).message }
  })
}
</script>
