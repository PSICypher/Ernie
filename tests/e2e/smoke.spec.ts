import { test, expect } from '@playwright/test';

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('offline page loads', async ({ page }) => {
  await page.goto('/_offline');
  await expect(page.getByRole('heading', { name: "You're Offline" })).toBeVisible();
});
