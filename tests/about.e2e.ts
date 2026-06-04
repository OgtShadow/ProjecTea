import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test('should display about page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.goto('/about');
    await expect(page.locator('h1')).toContainText('About');
  });
});
