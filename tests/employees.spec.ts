import { test, expect } from '@playwright/test';

test.describe('Employee Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/employees');
  });

  test('should display employees page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Employees');
  });

  test('should open add employee modal', async ({ page }) => {
    await page.click('button:has-text("Add Employee")');
    await expect(page.locator('text=Add New Employee')).toBeVisible();
  });

  test('should create new employee', async ({ page }) => {
    await page.click('button:has-text("Add Employee")');
    
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@test.com');
    await page.fill('input[name="mobile"]', '9876543210');
    await page.selectOption('select[name="outlet_id"]', { index: 1 });
    await page.selectOption('select[name="salary_type"]', 'monthly');
    await page.fill('input[name="salary_amount"]', '30000');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should search employees', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'John');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should filter by outlet', async ({ page }) => {
    await page.selectOption('select', { index: 1 });
    await expect(page.locator('table')).toBeVisible();
  });

  test('should open transfer modal', async ({ page }) => {
    const transferButton = page.locator('button:has-text("Transfer")').first();
    if (await transferButton.isVisible()) {
      await transferButton.click();
      await expect(page.locator('text=Transfer Employee')).toBeVisible();
    }
  });
});
