import { test, expect } from '@playwright/test';

// Test for the frontend application running on Vite dev server
test.describe('Frontend Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Navigate to the frontend application
    await page.goto('/');
  });

  test('should load the main page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/ChatApp/);
    await expect(page).toBeTruthy();
  });

  test('should display chat navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // The chat page should be the default view
    await expect(page.getByRole('link', { name: 'chat' })).toBeVisible();
  });

  test('should display chat interface', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Check for chat-related elements
    await expect(page.getByRole('link', { name: 'chat' })).toBeVisible();
    await expect(page.locator('h1')).toContainText(/chat|Chat|ChatApp/i);
  });
});
