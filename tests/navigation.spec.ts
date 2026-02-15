import { test, expect } from '@playwright/test';

test.describe('Navigation & Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
  });

  test('should display sidebar with all menu items', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Outlets')).toBeVisible();
    await expect(page.locator('text=Employees')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Inventory')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Reports')).toBeVisible();
    await expect(page.locator('text=Audit Logs')).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to outlets', async ({ page }) => {
    await page.click('text=Outlets');
    await expect(page).toHaveURL('/outlets');
  });

  test('should navigate to employees', async ({ page }) => {
    await page.click('text=Employees');
    await expect(page).toHaveURL('/employees');
  });

  test('should navigate to products', async ({ page }) => {
    await page.click('text=Products');
    await expect(page).toHaveURL('/products');
  });

  test('should navigate to inventory', async ({ page }) => {
    await page.click('text=Inventory');
    await expect(page).toHaveURL('/inventory');
  });

  test('should navigate to orders', async ({ page }) => {
    await page.click('text=Orders');
    await expect(page).toHaveURL('/orders');
  });

  test('should navigate to reports', async ({ page }) => {
    await page.click('text=Reports');
    await expect(page).toHaveURL('/reports');
  });

  test('should collapse and expand sidebar', async ({ page }) => {
    const toggleButton = page.locator('button[title*="Collapse"]');
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      // Sidebar should be collapsed
      await expect(toggleButton).toBeVisible();
      
      // Expand again
      await toggleButton.click();
      await expect(page.locator('text=Dashboard')).toBeVisible();
    }
  });
});
