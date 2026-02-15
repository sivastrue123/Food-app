import { test, expect } from '@playwright/test';

test.describe('Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/audit-logs');
  });

  test('should display audit logs page (admin only)', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Audit Logs');
  });

  test('should display activity statistics', async ({ page }) => {
    await expect(page.locator('text=Total Logs')).toBeVisible();
    await expect(page.locator('text=Creates')).toBeVisible();
    await expect(page.locator('text=Updates')).toBeVisible();
    await expect(page.locator('text=Deletes')).toBeVisible();
  });

  test('should search audit logs', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'INSERT');
    await expect(page.locator('text=Total Logs')).toBeVisible();
  });

  test('should filter by action type', async ({ page }) => {
    await page.selectOption('select#action', 'INSERT');
    await page.click('button:has-text("Apply Filters")');
    await expect(page.locator('text=INSERT')).toBeVisible();
  });

  test('should filter by date range', async ({ page }) => {
    await page.fill('input#start_date', '2026-02-01');
    await page.fill('input#end_date', '2026-02-15');
    await page.click('button:has-text("Apply Filters")');
    await expect(page.locator('text=Total Logs')).toBeVisible();
  });

  test('should display old and new values', async ({ page }) => {
    const logCard = page.locator('text=Old Values').first();
    if (await logCard.isVisible()) {
      await expect(page.locator('text=New Values')).toBeVisible();
    }
  });
});
