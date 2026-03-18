import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 1. Ambil Parameter dari URL
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const paymentMethod = searchParams.get('paymentMethod') || 'Semua';
    // Tambahan filter tanggal jika dibutuhkan nantinya
    const startDate = searchParams.get('startDate'); 
    const endDate = searchParams.get('endDate');

    // 2. Hitung Range Paginasi
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 3. Bangun Kueri Dasar
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' });

    // 4. Logika Pencarian (Berdasarkan ID Transaksi)
    if (search) {
      query = query.ilike('id', `%${search}%`);
    }

    // 5. Logika Filter Metode Pembayaran
    if (paymentMethod !== 'Semua') {
      query = query.eq('paymentMethod', paymentMethod);
    }

    // 6. Logika Filter Tanggal (Jika ada)
    // Asumsi menggunakan kolom default 'inserted_at' dari Supabase
    if (startDate && endDate) {
      query = query.gte('inserted_at', startDate).lte('inserted_at', endDate);
    }

    // 7. Eksekusi Kueri dengan Order & Range
    const { data, error, count } = await query
      .order('inserted_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    // 8. Mapping Data
    const transactions = data.map((trx) => ({
      id: trx.id,
      date: trx.date,
      items: trx.items,
      total: trx.totalPrice,
      paymentMethod: trx.paymentMethod,
      proofLink: trx.proofLink,
    }));

    // 9. Kembalikan Response Lengkap dengan Metadata Paginasi
    return NextResponse.json({
      transactions,
      total: count,
      page,
      limit
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: 'Gagal mengambil riwayat transaksi' }, 
      { status: 500 }
    );
  }
}