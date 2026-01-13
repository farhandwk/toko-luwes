// app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Baca Sheet "Transactions" dari baris A sampai F
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Transactions!A2:F', // Mulai A2 biar Header gak ikut
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json([]);
    }

    // Ubah Array Spreadsheet jadi Array of Objects JSON yang rapi
    const transactions = rows.map((row) => ({
      id: row[0],
      date: row[1],
      items: row[2], // Masih string JSON
      total: row[3],
      paymentMethod: row[4],
      proofLink: row[5],
    })).reverse(); // Balik urutan biar yang terbaru diatas (default)

    return NextResponse.json(transactions);

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}