import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('admin@luwes.com');
  await page.getByText('Password').click();
  await page.locator('div').filter({ hasText: /^Password$/ }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Masuk Aplikasi' }).click();
  await page.getByRole('button', { name: 'Tambah +' }).nth(2).click();
  await page.getByPlaceholder('0').nth(1).click();
  await page.getByPlaceholder('0').nth(1).fill('10000');
  await expect(page.getByRole('button').filter({ hasText: 'Bayar' })).toBeDisabled()
});