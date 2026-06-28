<template>
  <div>
    <div class="editor-toolbar">
      <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('bold') }"      @click="editor?.chain().focus().toggleBold().run()"                     title="粗體"><BoldIcon :size="14" /></button>
      <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('italic') }"    @click="editor?.chain().focus().toggleItalic().run()"                   title="斜體"><ItalicIcon :size="14" /></button>
      <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('strike') }"    @click="editor?.chain().focus().toggleStrike().run()"                   title="刪除線"><StrikethroughIcon :size="14" /></button>
      <div class="tb-divider" />
      <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('heading', { level: 2 }) }" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()" title="標題">H2</button>
      <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('heading', { level: 3 }) }" @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()" title="小標題">H3</button>
      <div class="tb-divider" />
      <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('bulletList') }"  @click="editor?.chain().focus().toggleBulletList().run()"              title="項目清單"><ListIcon :size="14" /></button>
      <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('orderedList') }" @click="editor?.chain().focus().toggleOrderedList().run()"            title="有序清單"><ListOrderedIcon :size="14" /></button>
      <div class="tb-divider" />
      <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('blockquote') }" @click="editor?.chain().focus().toggleBlockquote().run()"              title="引用"><QuoteIcon :size="14" /></button>
      <button type="button" class="tb-btn" :class="{ 'tb-btn--active': editor?.isActive('code') }"       @click="editor?.chain().focus().toggleCode().run()"                    title="行內代碼"><CodeIcon :size="14" /></button>
      <div class="tb-divider" />
      <button type="button" class="tb-btn" @click="editor?.chain().focus().undo().run()" title="復原"><Undo2Icon :size="14" /></button>
      <button type="button" class="tb-btn" @click="editor?.chain().focus().redo().run()" title="取消復原"><Redo2Icon :size="14" /></button>
    </div>
    <EditorContent :editor="editor" class="prose-editor" />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold as BoldIcon, Italic as ItalicIcon, Strikethrough as StrikethroughIcon,
  List as ListIcon, ListOrdered as ListOrderedIcon,
  Quote as QuoteIcon, Code as CodeIcon,
  Undo2 as Undo2Icon, Redo2 as Redo2Icon,
} from 'lucide-vue-next'

const model = defineModel<string>({ required: true })

const editor = useEditor({
  extensions: [StarterKit],
  content: model.value,
  editorProps: { attributes: { class: 'prose-content' } },
  onUpdate({ editor: e }) {
    const html = e.getHTML()
    if (html !== model.value) model.value = html
  },
})

watch(model, (val) => {
  if (!editor.value || editor.value.getHTML() === val) return
  editor.value.commands.setContent(val)
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style scoped>
.editor-toolbar {
  display: flex; align-items: center; flex-wrap: nowrap; gap: 2px;
  padding: 6px 8px; border-radius: 8px 8px 0 0;
  border: 1px solid var(--c-border); border-bottom: none;
  background: color-mix(in srgb, var(--c-card) 70%, var(--c-border) 30%);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.editor-toolbar::-webkit-scrollbar { display: none; }
.tb-btn {
  display: flex; align-items: center; justify-content: center;
  min-width: 28px; height: 26px; padding: 0 5px; border-radius: 5px; cursor: pointer;
  font-size: 11px; font-family: Inter, sans-serif; font-weight: 700;
  color: var(--c-inkMuted); transition: background 0.12s, color 0.12s;
}
.tb-btn:hover { background: color-mix(in srgb, var(--c-primary) 12%, transparent); color: var(--c-ink); }
.tb-btn--active { background: color-mix(in srgb, var(--c-primary) 18%, transparent); color: var(--c-primary); }
.tb-divider { width: 1px; height: 18px; background: var(--c-border); margin: 0 3px; opacity: 0.6; }

.prose-editor {
  border: 1px solid var(--c-border); border-radius: 0 0 8px 8px;
  min-height: 220px;
  background: color-mix(in srgb, var(--c-base) 60%, var(--c-card) 40%);
  transition: border-color 0.15s;
}
.prose-editor:focus-within { border-color: var(--c-primary); }

.prose-editor :deep(.prose-content) {
  padding: 14px 16px; min-height: 220px; outline: none;
  font-family: Inter, sans-serif; font-size: 14px; line-height: 1.7; color: var(--c-ink);
}
.prose-editor :deep(.prose-content p) { margin: 0 0 0.6em; }
.prose-editor :deep(.prose-content h2) { font-family: 'Barlow Condensed', sans-serif; font-size: 1.25em; font-weight: 700; margin: 1em 0 0.4em; color: var(--c-ink); }
.prose-editor :deep(.prose-content h3) { font-family: 'Barlow Condensed', sans-serif; font-size: 1.1em; font-weight: 700; margin: 0.8em 0 0.3em; color: var(--c-ink); }
.prose-editor :deep(.prose-content ul) { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
.prose-editor :deep(.prose-content ol) { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
.prose-editor :deep(.prose-content li) { margin: 0.2em 0; }
.prose-editor :deep(.prose-content blockquote) {
  border-left: 3px solid var(--c-primary); padding-left: 12px; margin: 0.6em 0;
  color: var(--c-inkMuted); font-style: italic;
}
.prose-editor :deep(.prose-content code) {
  font-family: 'Space Mono', monospace; font-size: 0.85em;
  background: color-mix(in srgb, var(--c-primary) 10%, transparent);
  color: var(--c-primary); padding: 1px 5px; border-radius: 4px;
}
.prose-editor :deep(.prose-content strong) { color: var(--c-ink); font-weight: 700; }
.prose-editor :deep(.prose-content em) { font-style: italic; }
.prose-editor :deep(.prose-content s) { opacity: 0.5; }
.prose-editor :deep(.ProseMirror-focused) { outline: none; }
</style>
