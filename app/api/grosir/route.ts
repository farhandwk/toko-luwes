import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '', serviceAccountAuth);

// GET: Ambil Data Grup & Harga Khusus
export async function GET() {
  try {
    await doc.loadInfo();
    
    // 1. Ambil Customer Groups
    const sheetGroups = doc.sheetsByTitle['customer_groups'];
    const rowsGroups = await sheetGroups.getRows();
    const groups = rowsGroups.map((row: any) => ({
      id: row.get('id'),
      name: row.get('name'),
    }));

    // 2. Ambil Special Prices
    const sheetPrices = doc.sheetsByTitle['special_prices'];
    const rowsPrices = await sheetPrices.getRows();
    const prices = rowsPrices.map((row: any) => ({
      id: row.get('id'),
      product_id: row.get('product_id'),
      group_id: row.get('group_id'),
      price: Number(row.get('price')),
    }));

    return NextResponse.json({ groups, prices });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ groups: [], prices: [] }); // Return kosong jika sheet belum ada
  }
}

// POST: Simpan Data (Bisa tambah Grup atau Harga)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body; // type: 'group' | 'price'

    await doc.loadInfo();

    if (type === 'group') {
      const sheet = doc.sheetsByTitle['customer_groups'];
      await sheet.addRow({ id: `GRP-${Date.now()}`, name: data.name });
    } 
    else if (type === 'price') {
      const sheet = doc.sheetsByTitle['special_prices'];
      // Cek apakah sudah ada harga untuk produk+grup ini? (Update logic sederhana: Hapus lama, tambah baru)
      const rows = await sheet.getRows();
      const existingRow = rows.find((r: any) => r.get('product_id') === data.product_id && r.get('group_id') === data.group_id);
      
      if (existingRow) {
        existingRow.assign({ price: data.price });
        await existingRow.save();
      } else {
        await sheet.addRow({ 
          id: `SP-${Date.now()}`, 
          product_id: data.product_id, 
          group_id: data.group_id, 
          price: data.price 
        });
      }
    }
    else if (type === 'delete_group') {
       const sheet = doc.sheetsByTitle['customer_groups'];
       const rows = await sheet.getRows();
       const row = rows.find((r: any) => r.get('id') === data.id);
       if(row) await row.delete();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal simpan' }, { status: 500 });
  }
}