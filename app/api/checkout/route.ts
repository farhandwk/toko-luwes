import { NextResponse } from 'next/server';
import { saveTransaction, updateStock } from '@/lib/googleSheets'; // <--- Import updateStock
import { Transaction } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, total, proofLink, paymentMethod, date } = body

    const transactionId = `TRX-${Date.now()}`;
    const transactionDate = date || new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    const newTransaction: Transaction = {
      id: transactionId,
      date: transactionDate,
      items: items,
      totalPrice: total,
      paymentMethod: paymentMethod || 'Cash',
      proofLink: proofLink || '', // Simpan linknya
    };

    // 1. Simpan Transaksi (PENTING: Gunakan Promise.all agar jalan paralel biar cepat)
    // Atau berurutan jika ingin memastikan transaksi tersimpan dulu baru stok dikurangi
    
    await saveTransaction(newTransaction); // Simpan riwayat dulu
    await updateStock(items);              // Baru kurangi stok

    // Jika ingin sangat robust, harusnya ada error handling jika step 1 sukses tapi step 2 gagal.
    // Tapi untuk MVP, ini sudah cukup.

    return NextResponse.json({ 
      success: true, 
      message: 'Transaksi berhasil & Stok update!', 
      transactionId 
    });

  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: 'Gagal memproses transaksi' }, { status: 500 });
  }
}