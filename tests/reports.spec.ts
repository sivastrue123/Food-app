import { test, expect } from '@playwright/test';

test.describe('Reports & Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/reports');
  });

  test('should display reports page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Reports');
  });

  test('should display sales statistics', async ({ page }) => {
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Orders Today')).toBeVisible();
  });

  test('should filter by date range', async ({ page }) => {
    await page.fill('input[type="date"]', '2026-02-01');
    const applyButton = page.locator('button:has-text("Apply")');
    if (await applyButton.isVisible()) {
      await applyButton.click();
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should display order history', async ({ page }) => {
    await expect(page.locator('text=Order History')).toBeVisible();
  });

  test('should view order details', async ({ page }) => {
    const viewButton = page.locator('button:has-text("View")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page.locator('text=Order Details')).toBeVisible();
    }
  });
});
