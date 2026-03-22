import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Username' }).fill('admin@luwes.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');
  await page.getByRole('button', { name: 'Tambah +' }).nth(2).click();
  await page.getByRole('button', { name: 'Tambah +' }).nth(2).dblclick();
  await page.getByRole('button', { name: 'Tambah +' }).nth(2).click();
  await page.getByRole('button', { name: 'Tambah +' }).nth(2).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'QRIS' }).click();
  await page.getByRole('button', { name: 'Bayar Rp' }).click();
  await expect(page.getByText('tidak mencukupi')).toBeVisible()
});