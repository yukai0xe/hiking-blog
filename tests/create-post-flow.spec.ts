import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test('Create post flow: navigate to /create, fill title, step through form, submit, return home', async ({ page }) => {
  // ── Step 1: Navigate to home and click 新增記錄 ──────────────────
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });

  const createLink = page.locator('a[href="/create"]', { hasText: '新增記錄' }).first();
  await createLink.waitFor({ timeout: 8000 });
  await createLink.click();

  await page.waitForURL('**/create', { timeout: 10000 });
  expect(page.url()).toContain('/create');

  // ── Step 2: Enter title "Test1" and step through 5 steps ──────────
  const titleInput = page.locator('input[placeholder="這次登山的名稱"]');
  await titleInput.waitFor({ timeout: 8000 });
  await titleInput.fill('Test1');

  // Steps 1 → 2 → 3 → 4 → 5 (click 下一步 4 times)
  for (let i = 1; i <= 4; i++) {
    const nextBtn = page.locator('button', { hasText: '下一步' });
    await nextBtn.waitFor({ timeout: 5000 });
    await nextBtn.click();
    await page.waitForTimeout(300);
  }

  // Verify we're on step 5 — the submit button should now be visible
  const submitBtn = page.locator('button', { hasText: '完成送出' });
  await submitBtn.waitFor({ timeout: 5000 });
  await expect(submitBtn).toBeVisible();

  // ── Step 3: Submit and verify redirect to /detail/<uuid> ──────────
  await submitBtn.click();

  await page.waitForURL(/\/detail\/[0-9a-f-]+/, { timeout: 30000 });
  expect(page.url()).toMatch(/\/detail\/[0-9a-f-]+/);

  // ── Step 4: Click 返回 — should go back to / ─────────────────────
  const backBtn = page.locator('button', { hasText: '返回' });
  await backBtn.waitFor({ timeout: 8000 });
  await backBtn.click();

  await page.waitForURL(BASE + '/', { timeout: 10000 }).catch(() =>
    page.waitForURL(BASE, { timeout: 5000 })
  );
  expect(page.url().replace(/\/$/, '')).toBe(BASE);

  // ── Step 5: Exactly 1 post card should be visible ─────────────────
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  const cards = page.locator('.card-wrap');
  await expect(cards).toHaveCount(1, { timeout: 10000 });
});
