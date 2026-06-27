<template>
  <div class="min-h-screen textured-bg vignette py-8">
    <div class="relative z-10 px-4">

      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <button
              class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
              @click="$router.back()" aria-label="返回"
            >
              <ArrowLeftIcon :size="17" />
            </button>
            <div>
              <p class="text-xs font-body tracking-[0.25em] uppercase text-primary opacity-60">Edit Entry</p>
              <h1 class="font-heading text-xl font-bold text-ink">編輯記錄</h1>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="delete-btn flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold font-body cursor-pointer transition-all duration-200"
              :disabled="store.loading"
              @click="confirmingDelete = true"
            >
              <Trash2Icon :size="15" />
              刪除
            </button>
            <button
              class="btn-cta flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold font-body cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="store.loading || !form.title.trim()"
              @click="save"
            >
              <span v-if="store.loading" class="w-4 h-4 border-2 rounded-full animate-spin border-current border-t-transparent" />
              <SaveIcon v-else :size="15" />
              {{ store.loading ? '儲存中…' : '儲存' }}
            </button>
          </div>
        </div>

        <!-- Save error banner -->
        <div
          v-if="store.error && !confirmingDelete"
          class="mb-4 px-4 py-2.5 rounded-lg flex items-center gap-2 font-body text-sm"
          style="background: rgba(220,60,60,0.12); border: 1px solid rgba(220,60,60,0.35); color: #e07070;"
        >
          <AlertCircleIcon :size="14" class="shrink-0" />
          {{ store.error }}
        </div>
      </div>

      <PostDeleteModal
        :open="confirmingDelete"
        :post-title="store.currentPost?.title ?? ''"
        :loading="store.loading"
        :error="store.error"
        @confirm="handleDelete"
        @cancel="confirmingDelete = false"
      />

      <!-- Loading -->
      <div v-if="pageLoading" class="max-w-2xl mx-auto card-aged p-10 text-center text-inkMuted font-body">
        <div class="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
        載入中…
      </div>

      <template v-else>
        <div class="max-w-2xl mx-auto">
          <PostStepIndicator v-model:step="step" :total-steps="TOTAL_STEPS" :step-labels="stepLabels" />

          <div class="card-aged p-6">
            <PostStepBasic
              v-show="step === 1"
              v-model="form"
              :difficulty-max="profile.difficultyMax"
              :difficulty-labels="profile.difficultyLabels"
            />
            <PostStepCover
              v-show="step === 2"
              ref="coverRef"
              :current-cover-url="store.currentPost?.coverImage ?? null"
            />
            <PostStepPhotos
              v-show="step === 3"
              ref="photosRef"
              :existing-photos="store.currentPhotos"
              :pending-deletes="pendingDeletes"
              @mark-delete="markDelete"
              @undo-delete="undoDelete"
            />
            <PostStepDetails
              v-show="step === 4"
              v-model="form"
            />

            <PostStepNav
              :step="step"
              :total-steps="TOTAL_STEPS"
              :loading="store.loading"
              :can-save="!!form.title.trim()"
              @prev="step--"
              @next="step++"
              @save="save"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft as ArrowLeftIcon, Save as SaveIcon, AlertCircle as AlertCircleIcon, Trash2 as Trash2Icon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { usePostStore } from '../stores/postStore'
import { useProfileStore } from '../stores/profileStore'
import { usePostEditForm } from '../composables/usePostEditForm'
import PostDeleteModal   from '../components/PostDeleteModal.vue'
import PostStepIndicator from '../components/PostStepIndicator.vue'
import PostStepBasic     from '../components/PostStepBasic.vue'
import PostStepCover     from '../components/PostStepCover.vue'
import PostStepPhotos    from '../components/PostStepPhotos.vue'
import PostStepDetails   from '../components/PostStepDetails.vue'
import PostStepNav       from '../components/PostStepNav.vue'

const route   = useRoute()
const router  = useRouter()
const store   = usePostStore()
const profile = useProfileStore()

const id = route.params.id as string

const TOTAL_STEPS = 4
const stepLabels  = ['基本', '封面', '照片', '詳細資訊']

const step             = ref(1)
const pageLoading      = ref(true)
const confirmingDelete = ref(false)

const coverRef  = ref<InstanceType<typeof PostStepCover>  | null>(null)
const photosRef = ref<InstanceType<typeof PostStepPhotos> | null>(null)

const { currentPhotos } = storeToRefs(store)
const { form, pendingDeletes, toDateInput, markDelete, undoDelete } = usePostEditForm(currentPhotos)

onMounted(async () => {
  await store.fetchPostDetail(id)
  if (store.currentPost) {
    const p = store.currentPost
    form.value.title           = p.title
    form.value.description     = p.description ?? ''
    form.value.dateStart       = toDateInput(p.dateStart)
    form.value.dateEnd         = toDateInput(p.dateEnd)
    form.value.weather         = p.weather         ?? ''
    form.value.peopleCount     = p.peopleCount     ?? null
    form.value.difficultyStars = p.difficultyStars ?? null
    form.value.tags            = p.tags?.length ? [...p.tags] : []
    form.value.showGpx         = p.showGpx  !== false
    form.value.showGears       = p.showGears !== false
    form.value.showFoods       = p.showFoods !== false
  }
  pageLoading.value = false
})

async function handleDelete() {
  try {
    await store.deletePost(id)
    router.replace('/')
  } catch { /* error shown via store.error */ }
}

async function save() {
  try {
    await store.updatePost(id, {
      title:            form.value.title,
      description:      form.value.description,
      coverFile:        coverRef.value?.getCoverFile() ?? null,
      gpxFile:          null,
      photoFilesToAdd:  photosRef.value?.getNewFiles() ?? [],
      photoIdsToDelete: pendingDeletes.value,
      gearsToAdd:           [],
      libraryGearIdsToLink: [],
      gearsToUpdate:    [],
      gearIdsToDelete:  [],
      dateStart:        form.value.dateStart  || undefined,
      dateEnd:          form.value.dateEnd    || undefined,
      weather:          form.value.weather         || undefined,
      peopleCount:      form.value.peopleCount,
      difficultyStars:  form.value.difficultyStars,
      tags:             form.value.tags,
      foods:            store.currentFoods.map(f => ({
        id:           f.id,
        name:         f.name,
        weight:       f.weight,
        quantity:     f.quantity,
        note:         f.note,
        referenceUrl: f.referenceUrl ?? '',
        price:        f.price ?? null,
      })),
      showGpx:   form.value.showGpx,
      showGears: form.value.showGears,
      showFoods: form.value.showFoods,
    })
    router.push(`/detail/${id}`)
  } catch { /* error shown via store.error */ }
}
</script>

<style scoped>
.delete-btn {
  background: rgba(220, 60, 60, 0.1);
  color: #e07070;
  border: 1px solid rgba(220, 60, 60, 0.35);
}
.delete-btn:hover:not(:disabled) {
  background: rgba(220, 60, 60, 0.2);
  border-color: rgba(220, 60, 60, 0.6);
  color: #f08080;
}
</style>
