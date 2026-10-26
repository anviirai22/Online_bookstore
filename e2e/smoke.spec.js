import { expect, test } from '@playwright/test';

test('guest can browse and search the catalogue', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Find the book that keeps you company/i })).toBeVisible();
  await page.getByRole('link', { name: /Explore the shelves/i }).click();
  await expect(page.getByRole('heading', { name: 'Browse the shelves' })).toBeVisible();
  await page.getByLabel(/Search by title/i).fill('javascript');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText(/Reliable JavaScript Systems/i)).toBeVisible();
});

test('customer is routed to sign in before checkout', async ({ page }) => {
  await page.goto('/books');
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  const menuToggle = page.getByRole('button', { name: 'Toggle navigation' });
  if (await menuToggle.isVisible()) await menuToggle.click();
  await page.getByRole('link', { name: /^Cart with \d+ items$/i }).click();
  await page.getByRole('button', { name: /Sign in to checkout/i }).click();
  await expect(page).toHaveURL(/\/login/);
});
