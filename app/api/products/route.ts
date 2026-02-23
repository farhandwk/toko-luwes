// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

import { authConfig } from '@/auth.config';
import { auth } from "@/auth"


// Helper Auth Google Sheets
const getSheets = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
};

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Products'; // Pastikan nama sheet di GSheets kamu 'Products'

// 1. GET: Ambil Semua Produk
export async function GET() {
  try {
    // Pengaman agar hanya user login yang bisa menjalankan function
    const session = await auth()
    if (!session) {
      return NextResponse.json({error: "User belum login", status: 401})
    }
    // const sheets = getSheets();
    // const response = await sheets.spreadsheets.values.get({
    //   spreadsheetId: SPREADSHEET_ID,
    //   range: `${SHEET_NAME}!A2:F`, // Asumsi: ID, Name, Price, Category, Image, Stock
    // });

    // const rows = response.data.values || [];
    // const products = rows.map((row) => ({
    //   id: row[0],
    //   name: row[1],
    //   price: Number(row[2]),
    //   category: row[3],
    //   image: row[4],
    //   stock: Number(row[5]),
    // }));

    // return NextResponse.json(products);

    const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

    if (error) {
      console.error('Supabase Error: ', error)
      throw error
    }

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal ambil data' }, { status: 500 });
  }
}

// 2. POST: Tambah Produk Baru
export async function POST(req: Request) {
  try {
    // Pengaman agar hanya user login yang bisa menjalankan function
    const session = await auth()
    if (!session) {
      return NextResponse.json({error: "User belum login", status: 401})
    }
    const body = await req.json();
    const { name, price, category, image, stock } = body;
    const id = `PROD-${Date.now()}`; // Generate ID unik

    // const sheets = getSheets();
    // await sheets.spreadsheets.values.append({
    //   spreadsheetId: SPREADSHEET_ID,
    //   range: `${SHEET_NAME}!A:F`,
    //   valueInputOption: 'USER_ENTERED',
    //   requestBody: {
    //     values: [[id, name, price, category, image, stock]],
    //   },
    // });

    // return NextResponse.json({ success: true, id });

    const data = {id, name, price, category, image, stock}

    const {error} = await supabaseAdmin
    .from('products')
    .insert([data])

    if (error) {
      throw error
    }

    return NextResponse.json({success: true, id})
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal tambah produk' }, { status: 500 });
  }
}

// 3. PUT: Edit Produk
export async function PUT(req: Request) {
  try {
    // Pengaman agar hanya user login yang bisa menjalankan function
    const session = await auth()
    if (!session) {
      return NextResponse.json({error: "User belum login", status: 401})
    }
    const body = await req.json();
    const { id, name, price, category, image, stock } = body;

    // const sheets = getSheets();
    
    // // Cari baris ke berapa produk ini berada
    // const list = await sheets.spreadsheets.values.get({
    //     spreadsheetId: SPREADSHEET_ID,
    //     range: `${SHEET_NAME}!A:A`, // Ambil kolom ID saja
    // });
    
    // const rows = list.data.values || [];
    // const rowIndex = rows.findIndex((row) => row[0] === id);

    // if (rowIndex === -1) {
    //     return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    // }

    // // Google Sheets index mulai dari 1, array mulai dari 0. 
    // // Baris di sheet = rowIndex + 1.
    // const range = `${SHEET_NAME}!B${rowIndex + 1}:F${rowIndex + 1}`; // Update Kolom B sampai F (Nama s/d Stok)

    // await sheets.spreadsheets.values.update({
    //     spreadsheetId: SPREADSHEET_ID,
    //     range: range,
    //     valueInputOption: 'USER_ENTERED',
    //     requestBody: {
    //         values: [[name, price, category, image, stock]]
    //     }
    // });

    // return NextResponse.json({ success: true });

    const {error} = await supabaseAdmin
    .from('products')
    .update({name: name, price: price, category: category, image: image, stock: stock})
    .eq('id', id)
    .select()

    if (error) {
      throw error
    }

    return NextResponse.json({success: true, nameNew: name})
  } catch (error) {
    return NextResponse.json({ error: 'Gagal update produk' }, { status: 500 });
  }
}

// 4. DELETE: Hapus Produk
export async function DELETE(req: Request) {
    try {
    // Pengaman agar hanya user login yang bisa menjalankan function
    const session = await auth()
    if (!session) {
      return NextResponse.json({error: "User belum login", status: 401})
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

        // const sheets = getSheets();

        // // Cari index baris
        // const list = await sheets.spreadsheets.values.get({
        //     spreadsheetId: SPREADSHEET_ID,
        //     range: `${SHEET_NAME}!A:A`,
        // });

        // const rows = list.data.values || [];
        // const rowIndex = rows.findIndex((row) => row[0] === id);

        // if (rowIndex === -1) {
        //     return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
        // }

        // // Hapus baris menggunakan batchUpdate (DeleteDimension)
        // // Note: rowIndex 0 di API = Baris 1 di Sheet.
        // // API deleteDimension menggunakan index 0-based.
        
        // await sheets.spreadsheets.batchUpdate({
        //     spreadsheetId: SPREADSHEET_ID,
        //     requestBody: {
        //         requests: [
        //             {
        //                 deleteDimension: {
        //                     range: {
        //                         sheetId: 0, // Asumsi Sheet 'Products' adalah sheet pertama (GID 0). Cek URL GSheets `gid=0`
        //                         dimension: "ROWS",
        //                         startIndex: rowIndex, 
        //                         endIndex: rowIndex + 1
        //                     }
        //                 }
        //             }
        //         ]
        //     }
        // });

        // return NextResponse.json({ success: true });

      if (!id) {
          return NextResponse.json({error: "Id Produk tidak disertkan"})
        } 

        const {error} = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id)


        if (error) {
          throw error
        }

        return NextResponse.json({success: true, deleted: id, status: 400})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Gagal hapus produk' }, { status: 500 });
    }
}