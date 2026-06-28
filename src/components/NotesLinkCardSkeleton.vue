<template>
  <!-- Mirrors NoteLinkCard responsive layout: column on mobile, row on sm+ -->
  <div class="card-skeleton">

    <!-- Cover block -->
    <div class="cover-skel" />

    <!-- Body: text lines + hint placeholder -->
    <div class="body-skel">
      <div class="info-skel">
        <div class="line-skel w-3/4 h-3.5 mb-2" />
        <div class="line-skel w-1/2 h-2.5 mb-1.5" />
        <div class="line-skel w-2/3 h-2" />
      </div>
      <div class="hint-skel" />
    </div>

  </div>
</template>

<style scoped>
.card-skeleton {
  display: flex;
  flex-direction: column;   /* mobile: stacked */
  overflow: hidden;
  background: var(--c-card);
  border: 1px solid color-mix(in srgb, var(--c-border) 60%, transparent);
}

.cover-skel {
  width: 100%;
  height: 130px;
  background: color-mix(in srgb, var(--c-border) 55%, transparent);
  flex-shrink: 0;
}

.body-skel {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.info-skel {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
}

.line-skel {
  background: color-mix(in srgb, var(--c-border) 80%, transparent);
  border-radius: 4px;
}

.hint-skel {
  width: 10px;
  height: 18px;
  margin-right: 10px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--c-border) 50%, transparent);
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .card-skeleton { flex-direction: row; }
  .cover-skel    { width: 200px; height: 110px; }
  .info-skel     { padding: 10px 14px; }
}
</style>
