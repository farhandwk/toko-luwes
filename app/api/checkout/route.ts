import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Akses ditolak!" }, { status: 401 });

    const body = await req.json();
    const { items, total, paymentMethod, date, cash_amount, change_amount } = body;

    if (!items || items.length === 0) return NextResponse.json({ error: "Keranjang Kosong!" }, { status: 400 });

    // 1. Snapshot Items
    const slimItems = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      unit: item.units?.name || 'unit',
      is_decimal: item.is_decimal || false
    }));

    // 2. Update Stok (DIPERBAIKI)
    for (const item of items) {
      const { data: productData } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', item.id)
        .single();

      const currentStock = Number(productData?.stock || 0);
      const newStock = Number((currentStock - item.qty).toFixed(2));

      await supabaseAdmin
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.id); // <-- SUDAH DIPERBAIKI (TIDAK ADA TYPO 'id:')
    }

    // 3. Simpan Transaksi
    const transactionId = `TRX-${Date.now()}`;
    const newTransaction = {
      id: transactionId,
      date: date || new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      items: slimItems, 
      totalPrice: total,
      paymentMethod: paymentMethod || 'Cash',
      cash_amount: Number(cash_amount) || 0,
      change_amount: Number(change_amount) || 0,
      inserted_at: new Date().toISOString()
    };

    const { error: trxError } = await supabaseAdmin.from('transactions').insert([newTransaction]);
    if (trxError) throw trxError;

    return NextResponse.json({ success: true, transactionId, newTransaction });
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: 'Gagal memproses transaksi: ' + error.message }, { status: 500 });
  }
}