// lib/googleSheets.ts
import { google } from 'googleapis';
import { Product } from '@/types';
import { Transaction } from '@/types';
import { CartItem } from '@/hooks/useCart';

// 1. Setup Autentikasi
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // Trik khusus untuk menangani newline (\n) di env variable pada Vercel/Next.js
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ]
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// 2. Fungsi Mengambil Semua Produk
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'products!A2:E', // Baca dari baris 2 (header diabaikan) sampai kolom E
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    // Mapping array dari sheet menjadi Object Product
    // Asumsi urutan kolom: ID, Name, Price, Stock, Category
    return rows.map((row) => ({
      id: row[0] || '',
      name: row[1] || '',
      price: Number(row[2]) || 0,
      category: row[3] || '',
      image: row[4] || '',
      stock: Number(row[5]) || 0,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// FUNGSI BARU: Menyimpan Transaksi
export const saveTransaction = async (data: Transaction) => {
  try {
    // Siapkan baris data sesuai urutan kolom di Sheet 'transactions'
    // Kolom: id | date | items_json | total_price | payment_method | proof_link
    const row = [
      data.id,
      data.date,
      JSON.stringify(data.items), // Array items kita ubah jadi teks JSON
      data.totalPrice,
      data.paymentMethod,
      data.proofLink || '-'
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'transactions!A:F', // Masuk ke sheet transactions
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return true;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

// FUNGSI BARU: Update Stok Masal
export const updateStock = async (items: CartItem[]) => {
  try {
    // 1. Ambil semua data produk dulu untuk tahu posisi barisnya
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'products!A:F', // Kita butuh kolom ID (A) dan Stock (F)
    });

    const rows = response.data.values;
    if (!rows) return;

    // 2. Siapkan array untuk menampung update data
    // Kita akan menggunakan batchUpdate agar cuma 1x request ke Google
    const dataToUpdate: { range: string; values: string[][] }[] = [];

    items.forEach((item) => {
      // Cari baris mana yang punya ID produk ini
      // rows.findIndex return index array (mulai 0), tapi baris sheet mulai 1
      const rowIndex = rows.findIndex((row) => row[0] === item.id);

      if (rowIndex !== -1) {
        const currentStock = Number(rows[rowIndex][5]); // Kolom D (index 3) adalah stock
        const newStock = currentStock - item.qty;
        
        // Baris di sheet = rowIndex + 1
        // Kolom Stock adalah D
        // Jadi rangenya misal: products!D5
        const cellRange = `products!F${rowIndex + 1}`;

        dataToUpdate.push({
          range: cellRange,
          values: [[String(newStock)]],
        });
      }
    });

    if (dataToUpdate.length === 0) return;

    // 3. Eksekusi Update ke Google Sheets
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: dataToUpdate,
      },
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    // Kita tidak throw error di sini agar transaksi tetap tercatat 
    // meskipun update stok gagal (nanti bisa diperbaiki manual)
  }
};