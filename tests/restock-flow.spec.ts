import { test, expect } from '@playwright/test';

test('Restock barang secara dinamis', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('admin@luwes.com');
  await page.getByText('Password').click();
  await page.locator('div').filter({ hasText: /^Password$/ }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Masuk Aplikasi' }).click();
  // 2. NAVIGASI KE HALAMAN ADMIN PRODUK
  // Kita tunggu sampai dashboard muncul baru pindah, biar nggak 404
  await page.waitForURL('**/'); 
  await page.goto('http://localhost:3000/admin/products');

  // 3. CARI BARIS PRODUK "Sun kara"
  // Kita gunakan locator baris (tr) agar semua aksi terkunci di baris yang sama
  const barisProduk = page.locator('tr').filter({ hasText: 'Sun kara' });
  await expect(barisProduk).toBeVisible({ timeout: 10000 });

  // 4. AMBIL STOK AWAL SECARA DINAMIS
  // Di tabel Boss, stok ada di td dengan class 'text-center'
  const cellStok = barisProduk.locator('td.text-center');
  const teksStokAwal = await cellStok.innerText();
  // Kita ambil angkanya saja, misal "28 UNIT" jadi 28
  const stokAwal = parseInt(teksStokAwal.split(' ')[0]);

  // 5. KLIK TOMBOL RESTOCK (Warna Hijau / PackagePlus)
  // Berdasarkan kode Boss, ini adalah button dengan class 'text-green-600'
  await barisProduk.locator('button.text-green-600').click();

  // 6. PENGISIAN MODAL RESTOCK
  // Kita kunci pencarian di dalam Dialog agar tidak bentrok dengan input lain
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  // Berdasarkan kode Boss: placeholder-nya adalah "0"
  // Kita gunakan fill() untuk memasukkan angka tambahan
  const jumlahTambah = 50;
  await modal.getByPlaceholder('0').fill(jumlahTambah.toString());

  // Klik tombol Konfirmasi
  await modal.getByRole('button', { name: 'Konfirmasi' }).click();

  // 1. Tunggu sampai modal/dialog benar-benar hilang dari layar
await expect(page.getByRole('dialog')).toBeHidden();

// 2. (Opsional) Tunggu notifikasi toast sukses muncul agar sinkron dengan database
await expect(page.getByText(/Stok bertambah/i)).toBeVisible();

  // 7. VERIFIKASI AKHIR (MATEMATIKA)
  // Kita pastikan stok baru = stok awal + jumlah tambah
  const stokBaruExpected = stokAwal + jumlahTambah;
  
  // Kita beri jeda sedikit agar database selesai memproses (UI Re-fetch)
  await expect(cellStok).toContainText(stokBaruExpected.toString(), { timeout: 10000 });

  console.log(`✅ SUKSES: Stok awal ${stokAwal}, ditambah ${jumlahTambah}, sekarang jadi ${stokBaruExpected}`);
});