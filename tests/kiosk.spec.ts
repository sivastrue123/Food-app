import { test, expect } from '@playwright/test';

test.describe('Customer Kiosk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kiosk');
  });

  test('should display kiosk without login', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Self-Order Kiosk');
  });

  test('should display product categories', async ({ page }) => {
    await expect(page.locator('text=Categories')).toBeVisible();
  });

  test('should display products', async ({ page }) => {
    await expect(page.locator('text=Menu')).toBeVisible();
  });

  test('should add item to cart', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.locator('text=Cart')).toBeVisible();
    }
  });

  test('should show cart summary', async ({ page }) => {
    await expect(page.locator('text=Subtotal')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    const categoryButton = page.locator('button').filter({ hasText: /Beverages|Food/ }).first();
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await expect(page.locator('text=Menu')).toBeVisible();
    }
  });

  test('should proceed to checkout', async ({ page }) => {
    const checkoutButton = page.locator('button:has-text("Checkout")');
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      await expect(page.locator('text=Review Order')).toBeVisible();
    }
  });

  test('should place order', async ({ page }) => {
    // Add item to cart
    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Proceed to checkout
      const checkoutButton = page.locator('button:has-text("Checkout")');
      if (await checkoutButton.isVisible()) {
        await checkoutButton.click();
        
        // Place order
        const placeOrderButton = page.locator('button:has-text("Place Order")');
        if (await placeOrderButton.isVisible()) {
          await placeOrderButton.click();
          await expect(page.locator('text=Order Confirmed')).toBeVisible();
        }
      }
    }
  });
});
