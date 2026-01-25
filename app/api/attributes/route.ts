import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

// --- CONFIG ---
const serviceAccountAuth = new JWT({
  // [PERBAIKAN] Gunakan nama variabel yang sesuai dengan .env.local Anda
  email: process.env.GOOGLE_CLIENT_EMAIL, 
  
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '', serviceAccountAuth);

// 1. GET: Ambil Data (Categories / Units)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'categories' atau 'units'

    if (!type || (type !== 'categories' && type !== 'units')) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[type];
    
    // Cek jika sheet belum dibuat
    if (!sheet) {
        console.error(`Sheet '${type}' tidak ditemukan.`);
        return NextResponse.json([]); // Return array kosong biar gak error map
    }

    const rows = await sheet.getRows();
    
    // Mapping data
    const data = rows.map((row: any) => ({
      id: row.get('id'),
      name: row.get('name'),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
  }
}

// 2. POST: Tambah Data Baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, name } = body;

    if (!name || (type !== 'categories' && type !== 'units')) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[type];
    
    if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });

    const newId = `${type === 'categories' ? 'CAT' : 'UNIT'}-${Date.now()}`;
    await sheet.addRow({ id: newId, name });

    return NextResponse.json({ success: true, id: newId });
  } catch (error) {
    console.error("Post Error:", error);
    return NextResponse.json({ error: 'Gagal simpan' }, { status: 500 });
  }
}

// 3. DELETE: Hapus Data
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[type]; // @ts-ignore
    
    if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });

    const rows = await sheet.getRows();
    const rowToDelete = rows.find((row: any) => row.get('id') === id);

    if (rowToDelete) {
        await rowToDelete.delete();
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Gagal hapus' }, { status: 500 });
  }
}