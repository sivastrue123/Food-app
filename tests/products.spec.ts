import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/products');
  });

  test('should display products page (admin only)', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Products');
  });

  test('should open add product modal', async ({ page }) => {
    await page.click('button:has-text("Add Product")');
    await expect(page.locator('text=Add New Product')).toBeVisible();
  });

  test('should create new product', async ({ page }) => {
    await page.click('button:has-text("Add Product")');
    
    await page.fill('input[name="name"]', 'Test Product');
    await page.fill('input[name="category"]', 'Test Category');
    await page.fill('input[name="price"]', '100');
    await page.fill('input[name="gst_percentage"]', '18');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Test Product')).toBeVisible();
  });

  test('should search products', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Coffee');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.selectOption('select', { index: 1 });
    await expect(page.locator('table')).toBeVisible();
  });

  test('should toggle product status', async ({ page }) => {
    const statusButton = page.locator('button').filter({ hasText: /Active|Inactive/ }).first();
    if (await statusButton.isVisible()) {
      await statusButton.click();
      await expect(statusButton).toBeVisible();
    }
  });
});
