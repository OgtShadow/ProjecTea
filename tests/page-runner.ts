import { test, expect } from '@playwright/test';
import { HomePage } from './page/home';
import { AboutPage } from './page/about';

test.describe('Page Objects', () => {
  test('should navigate to home and display content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.shouldDisplayHelloWorld();
  });

  test('should navigate to about and display content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const aboutPage = new AboutPage(page);
    await aboutPage.goto();
    await aboutPage.shouldDisplayAboutContent();
  });
});
