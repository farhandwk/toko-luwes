import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "User belum login" }, { status: 401 });
    }

    const body = await req.json();
    const { items, total_price, payment_method, date, cash_amount, change_amount } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Keranjang Kosong!" }, { status: 400 });
    }

    // 1. Siapkan Snapshot Items (Sama seperti sebelumnya)
    const slimItems = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      unit: item.units?.name || 'unit',
      is_decimal: item.is_decimal || false
    }));

    const transactionId = `TRX-${Date.now()}`;
    const formattedDate = date || new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    // 2. EKSEKUSI RPC (The Magic Happens Here)
    // Kita kirim semua data ke database dalam satu kali panggil
    const { error: rpcError } = await supabaseAdmin.rpc('process_checkout_v2', {
      p_items: slimItems,
      p_trx_id: transactionId,
      p_total_price: Number(total_price) || 0,
      p_payment_method: payment_method,
      p_cash_amount: Number(cash_amount) || 0,
      p_change_amount: Number(change_amount) || 0,
      p_date: formattedDate
    });

    // Jika stok tidak cukup, RPC akan melempar exception dan ditangkap di sini
    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      transactionId, 
      newTransaction: { id: transactionId, items: slimItems, total_price } 
    });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: 'Gagal memproses transaksi: ' + error.message }, { status: 500 });
  }
}