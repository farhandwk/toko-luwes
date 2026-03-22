import { test, expect } from '@playwright/test';

test('Checkout Berhasil dengan Metode CASH(Tunai)', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByPlaceholder('Contoh: admin').click();
  await page.getByRole('textbox', { name: 'username' }).fill('admin@luwes.com')
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');
//   await expect(page.getByText('Produk')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: 'Tambah +' }).nth(1).click();
  await page.locator('div:nth-child(7) > .flex.items-center > .inline-flex').click();
  await page.locator('div:nth-child(2) > .flex.items-center.gap-1.mx-2 > .flex > button:nth-child(3)').click();
  await page.locator('div:nth-child(2) > .flex.items-center.gap-1.mx-2 > .flex > button:nth-child(3)').click();
  await page.getByPlaceholder('0').nth(1).click();
  await page.getByRole('combobox').click();
  await page.getByLabel('Tunai (Cash)').getByText('Tunai (Cash)').click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'QRIS' }).click();
  await page.getByRole('combobox').click();
  await page.getByText('Transfer Bank').click();
  await page.getByRole('combobox').click();
  await page.getByText('Tunai (Cash)').click();
  await page.getByPlaceholder('0').nth(1).click();
  await page.getByPlaceholder('0').nth(1).fill('50000');
  await page.getByPlaceholder('0').first().click();
  await page.getByPlaceholder('0').first().fill('5000');
  await page.getByRole('button', { name: 'Bayar Rp' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;
  // 1. Pastikan muncul pesan sukses (Toast)
// Sesuaikan teksnya dengan yang muncul di aplikasi Boss (misal: "Transaksi Sukses")
await expect(page.getByText('Transaksi Sukses')).toBeVisible();

// 2. Pastikan struk/receipt muncul (jika ada elemen tertentu)
await expect(page.getByRole('button', { name: 'Download' })).toBeEnabled();

// 3. Verifikasi download berhasil
console.log('Download path:', await download.path());
});