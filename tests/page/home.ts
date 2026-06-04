import { type Page, expect } from '@playwright/test';

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async shouldDisplayHelloWorld() {
    await expect(this.page.getByText('Hello World')).toBeVisible();
  }
}
