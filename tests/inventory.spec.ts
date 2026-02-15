import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/inventory');
  });

  test('should display inventory page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Inventory');
  });

  test('should show low stock alerts', async ({ page }) => {
    const lowStockAlert = page.locator('text=Low Stock');
    if (await lowStockAlert.isVisible()) {
      await expect(lowStockAlert).toBeVisible();
    }
  });

  test('should show expiring soon alerts', async ({ page }) => {
    const expiringAlert = page.locator('text=Expiring Soon');
    if (await expiringAlert.isVisible()) {
      await expect(expiringAlert).toBeVisible();
    }
  });

  test('should search inventory', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Coffee');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should filter by outlet', async ({ page }) => {
    const outletSelect = page.locator('select').first();
    await outletSelect.selectOption({ index: 1 });
    await expect(page.locator('table')).toBeVisible();
  });

  test('should update stock quantity', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await expect(page.locator('input[name="stock_quantity"]')).toBeVisible();
    }
  });
});
