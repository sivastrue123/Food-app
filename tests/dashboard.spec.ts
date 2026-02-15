import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard metrics', async ({ page }) => {
    // Check for metric cards
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Orders Today')).toBeVisible();
    await expect(page.locator('text=Active Outlets')).toBeVisible();
    await expect(page.locator('text=Total Employees')).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=New Order')).toBeVisible();
    await expect(page.locator('text=Manage Inventory')).toBeVisible();
  });

  test('should display top products widget', async ({ page }) => {
    await expect(page.locator('text=Top Products')).toBeVisible();
  });

  test('should display recent orders', async ({ page }) => {
    await expect(page.locator('text=Recent Orders')).toBeVisible();
  });

  test('should display sales trend chart', async ({ page }) => {
    await expect(page.locator('text=Sales Trend')).toBeVisible();
  });

  test('should navigate to orders from quick action', async ({ page }) => {
    await page.click('text=New Order');
    await expect(page).toHaveURL('/orders');
  });
});
