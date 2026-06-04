import { type Page, expect } from '@playwright/test';

export class AboutPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/about');
  }

  async shouldDisplayAboutContent() {
    await expect(this.page.getByText('About')).toBeVisible();
  }
}
