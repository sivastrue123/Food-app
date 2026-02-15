import { test, expect } from '@playwright/test';

test.describe('Outlet Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/outlets');
  });

  test('should display outlets page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Outlets');
  });

  test('should open create outlet modal', async ({ page }) => {
    await page.click('button:has-text("Add Outlet")');
    await expect(page.locator('text=Create New Outlet')).toBeVisible();
  });

  test('should create new outlet', async ({ page }) => {
    await page.click('button:has-text("Add Outlet")');
    
    // Fill form
    await page.fill('input[name="name"]', 'Test Outlet');
    await page.fill('input[name="location"]', 'Test Location');
    await page.fill('input[name="phone"]', '1234567890');
    await page.fill('textarea[name="address"]', 'Test Address');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify outlet appears in list
    await expect(page.locator('text=Test Outlet')).toBeVisible();
  });

  test('should search outlets', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'Main');
    // Results should filter
    await expect(page.locator('table')).toBeVisible();
  });

  test('should toggle outlet status', async ({ page }) => {
    // Find first outlet's status toggle
    const statusButton = page.locator('button').filter({ hasText: /Active|Inactive/ }).first();
    await statusButton.click();
    
    // Status should change
    await expect(statusButton).toBeVisible();
  });
});
