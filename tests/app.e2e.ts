import { test, expect } from '@playwright/test';

test.describe('Frontend Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the frontend page', async ({ page }) => {
    await expect(page).toHaveTitle(/Frontend/);
    await expect(page.getByText('Hello World')).toBeVisible();
  });

  test('should have correct navigation', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();

    // Test navigation items
    const navItems = page.locator('nav a');
    await expect(navItems).toHaveCount(2);

    // Click on Home
    await navItems.first.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
