# Waypoint Management — Frontend Changes

## Overview

記錄點（Waypoint）管理功能，涵蓋顯示、互動、新增、隱藏、刪除，以及後端同步後的即時更新。

---

## GpxViewer.vue

### Add-mode 提示覆蓋層

當 `addMode` prop 為 true 時，地圖上方顯示浮動提示 pill：

```
點擊地圖任意位置新增記錄點
```

- 位置：地圖頂部置中（`top-6`，`z-[1000]`，`pointer-events-none`）
- 動畫：`add-hint` Transition（fade + translateY）

### isCustom 傳播修復

在 `loadAndRender` 第一個迴圈中，當 GPX 檔案已把自訂記錄點 bake 進 `<wpt>` 時，正確把 `isCustom: true` 從 override 傳給 PanelItem：

```ts
if (ov) {
  if (ov.name) wpt.name = ov.name           // 空字串不覆蓋原始名稱
  if (ov.description) wpt.desc = ov.description
  if (ov.isCustom) wpt.isCustom = true
}
```

> **Why**: `ov.name` 為空字串表示使用者從未改過名稱，應保留 GPX 原始名稱。

### 隱藏記錄點重建迴圈（防禦性）

`loadAndRender` 新增第三個迴圈，處理非自訂但已被舊版 GPX sync 從檔案中移除的隱藏記錄點：

```ts
// 第三迴圈：從 override 重建已被 sync 移除的隱藏非自訂記錄點
for (const ov of (props.overrides ?? [])) {
  if (ov.isCustom || !ov.hidden) continue
  const alreadyEmitted = allForEmit.some(...)
  if (!alreadyEmitted)
    allForEmit.push({ ..., hidden: true })
}
```

> **Why**: GpxSyncQueue 舊版本會把非自訂隱藏記錄點從 GPX 檔案移除，重新整理後前端找不到對應 `<wpt>` 就無法重建。此迴圈從 `waypoint_overrides` 補回。

### selectWaypoint（暴露方法）

```ts
function selectWaypoint(lat: number, lng: number) {
  const wpt = waypoints.value.find(w => ...)
  if (!wpt || !map) return
  selectItem(wpt)
  map.panTo([wpt.lat, wpt.lng])
}

defineExpose({ updateWaypoint, addWaypointMarker, removeWaypointMarker, selectWaypoint })
```

供 Detail.vue 在使用者點擊卡片時呼叫，讓地圖同步高亮並移動視角。

---

## Detail.vue

### 卡片互動：單擊高亮、雙擊編輯

| 動作 | 行為 |
|------|------|
| 單擊卡片 | 高亮卡片（`wpt-card-selected` glow）、地圖記錄點切換為 active 狀態、顯示「雙擊進入編輯」提示 3 秒後淡出 |
| 雙擊卡片 | 開啟編輯 Modal |

```ts
function onWptClick(wpt: Waypoint) {
  selectedWpt.value = wpt
  gpxViewerRef.value?.selectWaypoint(wpt.lat, wpt.lng)
  hintWpt.value = wpt
  hintTimer = setTimeout(() => { hintWpt.value = null }, 3000)
}
```

**CSS**（scoped）：
```css
.wpt-card-selected {
  box-shadow:
    0 0 0 2px var(--c-primary),
    0 0 16px color-mix(in srgb, var(--c-primary) 30%, transparent);
}
.wpt-hint-enter-active { transition: opacity 0.2s ease; }
.wpt-hint-leave-active { transition: opacity 1s ease; }
```

### 新增記錄點按鈕移至地圖下方

原先在頂部工具列，現移到記錄點標題列右側。

點擊時觸發 `toggleAddMode()`，自動 scroll 到地圖頂部（`scrollIntoView({ behavior: 'smooth' })`）。

### 批次顯示/隱藏 Modal

- 入口：記錄點標題列「批次顯示/隱藏」按鈕（記錄點數 > 0 時顯示）
- 列出所有記錄點（含已隱藏），隱藏項顯示刪除線 + `EyeOffIcon`
- 支援全選（含 indeterminate 狀態）
- 確認後對每個勾選項呼叫 `toggleWptHidden`（已隱藏→顯示、已顯示→隱藏）

### 隱藏 PATCH 帶入 name/desc

```ts
body: JSON.stringify({ lat, lng, name: wpt.name, desc: wpt.desc, hidden: newHidden })
```

> **Why**: 後端 `SetWaypointHiddenAsync` 首次插入時需要名稱，否則存空字串，重新整理後名稱遺失。

### SSE 監聽（gpxUrl 更新）

後端 GPX sync 完成後透過 SSE 推送新 URL：

```ts
sseSource = new EventSource(`${apiBase}/api/Gpx/${id}/events`)
sseSource.onmessage = (e) => {
  const data = JSON.parse(e.data)
  if (data.gpxUrl && store.currentPost) store.currentPost.gpxFile = data.gpxUrl
}
```

---

## 資料流

```
使用者點擊「隱藏」
  → toggleWptHidden (樂觀 UI 更新)
  → PATCH /api/Gpx/{id}/waypoint  { lat, lng, name, desc, hidden }
  → 後端寫入 waypoint_overrides
  → GpxSyncQueue debounce 500ms
  → 背景 sync GPX 檔案
  → SSE 推送新 gpxUrl
  → store.currentPost.gpxFile 更新

重新整理後
  → fetchPostDetail → currentWaypointOverrides (含 hidden: true, name 正確)
  → GpxViewer loadAndRender → 第一迴圈：GPX 內的記錄點套用 hidden
  → 第三迴圈：已被 sync 移除但 override 仍有紀錄的補回
  → emit('waypoints-ready', allForEmit) → gpxWaypoints (含 hidden 狀態)
  → 卡片清單正確顯示隱藏/顯示狀態
```
