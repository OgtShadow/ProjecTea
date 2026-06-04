import { test, expect } from '@playwright/test';

test.describe('Hello World', () => {
  test('should display hello world', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.goto('/');

    // Check for the chat navigation link
    await expect(page.getByRole('link', { name: 'chat' })).toBeVisible();

    // Check for page title
    await expect(page).toHaveTitle(/ChatApp/i);
  });
});
