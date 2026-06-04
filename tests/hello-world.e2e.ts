import { test, expect } from '@playwright/test';

test.describe('Hello World', () => {
  test('should display Hello World', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Hello World')).toBeVisible();
  });
});
