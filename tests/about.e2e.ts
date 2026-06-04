import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test('should display About content', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText('About')).toBeVisible();
  });
});
