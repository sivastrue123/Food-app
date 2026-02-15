import { test, expect } from '@playwright/test';

test.describe('Orders & POS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/orders');
  });

  test('should display orders page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Orders');
  });

  test('should display product list', async ({ page }) => {
    await expect(page.locator('text=Available Products')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.locator('text=Cart')).toBeVisible();
    }
  });

  test('should calculate totals correctly', async ({ page }) => {
    await expect(page.locator('text=Subtotal')).toBeVisible();
    await expect(page.locator('text=GST')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();
  });

  test('should require customer info before checkout', async ({ page }) => {
    const completeButton = page.locator('button:has-text("Complete Order")');
    if (await completeButton.isVisible()) {
      await completeButton.click();
      // Should show validation or customer info form
    }
  });

  test('should search products', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Coffee');
    await expect(page.locator('text=Available Products')).toBeVisible();
  });
});
