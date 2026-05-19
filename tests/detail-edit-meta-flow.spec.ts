import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test('Detail → Edit → fill metadata → save → verify meta on detail page', async ({ page }) => {
  // ── Step 1: Go to home, click Test1 post → /detail/<uuid> ────────
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });

  // Click the card whose title is "Test1"
  const postCard = page.locator('.card-wrap').filter({ hasText: 'Test1' }).first();
  await postCard.waitFor({ timeout: 10000 });
  await postCard.click();

  await page.waitForURL(/\/detail\/[0-9a-f-]+/, { timeout: 15000 });
  const detailUrl = page.url();
  expect(detailUrl).toMatch(/\/detail\/[0-9a-f-]+/);

  // ── Step 2: Verify 3 tabs — 照片, 地圖, 裝備 ─────────────────────
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  const tabPhotos = page.locator('button', { hasText: '照片' });
  const tabMap    = page.locator('button', { hasText: '地圖' });
  const tabGear   = page.locator('button', { hasText: '裝備' });

  await expect(tabPhotos).toBeVisible({ timeout: 8000 });
  await expect(tabMap).toBeVisible({ timeout: 5000 });
  await expect(tabGear).toBeVisible({ timeout: 5000 });

  // Verify all 3 tabs can be clicked (switch between them)
  await tabMap.click();
  await page.waitForTimeout(300);
  await tabGear.click();
  await page.waitForTimeout(300);
  await tabPhotos.click();
  await page.waitForTimeout(300);

  // ── Step 3: Click 編輯 → /edit/<uuid> ────────────────────────────
  const editLink = page.locator('a', { hasText: '編輯' }).first();
  await editLink.waitFor({ timeout: 5000 });
  await editLink.click();

  await page.waitForURL(/\/edit\/[0-9a-f-]+/, { timeout: 15000 });
  expect(page.url()).toMatch(/\/edit\/[0-9a-f-]+/);

  // Wait for edit page to finish loading
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // ── Step 4: Fill 開始日期, 結束日期, 天氣, 人數 ────────────────────
  // These fields are on Step 1 (基本資訊) which is the default step

  const dateStartInput = page.locator('input[type="date"]').first();
  const dateEndInput   = page.locator('input[type="date"]').nth(1);
  await dateStartInput.waitFor({ timeout: 8000 });

  // HTML date input expects YYYY-MM-DD format
  await dateStartInput.fill('2026-01-01');
  await dateEndInput.fill('2026-01-05');

  const weatherSelect = page.locator('select.input-field').first();
  await weatherSelect.selectOption('起霧');

  const peopleInput = page.locator('input[placeholder="隊員人數"]');
  await peopleInput.fill('7');

  // ── Step 5: Click progress step "裝備" (step 5), then click 儲存 ──
  // The progress bar has spans with step labels; the parent div triggers navigation
  const gearStep = page.locator('span.font-body', { hasText: '裝備' }).first();
  await gearStep.waitFor({ timeout: 5000 });
  await gearStep.click();
  await page.waitForTimeout(400);

  // Verify we're on step 5 (gear section should be visible)
  await expect(page.locator('h2', { hasText: '新增裝備' })).toBeVisible({ timeout: 5000 });

  // Click 儲存
  const saveBtn = page.locator('button', { hasText: '儲存' }).first();
  await saveBtn.waitFor({ timeout: 5000 });
  await saveBtn.click();

  // ── Step 6: Verify redirect to /detail/<uuid> with meta data ─────
  await page.waitForURL(/\/detail\/[0-9a-f-]+/, { timeout: 30000 });
  expect(page.url()).toMatch(/\/detail\/[0-9a-f-]+/);

  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Meta chips below the title should show: weather, peopleCount, dateRange
  // dateRange format from fmtDate(): YYYY/MM/DD – YYYY/MM/DD
  await expect(page.locator('.meta-chip').filter({ hasText: '起霧' }).first()).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.meta-chip').filter({ hasText: '7 人' }).first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.meta-chip').filter({ hasText: '2026/01/01' }).first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.meta-chip').filter({ hasText: '2026/01/05' }).first()).toBeVisible({ timeout: 5000 });
});
