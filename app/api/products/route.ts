// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { auth } from "@/auth";

// 1. GET: Tetap sama (Sudah Benar)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "User belum login" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'Semua';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('products')
      .select('*, units(name), categories!inner(name)', { count: 'exact' });

    if (search) query = query.ilike('name', `%${search}%`);
    if (category !== 'Semua') query = query.eq('categories.name', category);

    const { data: products, error, count } = await query
      .order('name', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({ products, total: count, page, limit });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal ambil data' }, { status: 500 });
  }
}

// 2. POST: Tambah Produk (DIPERBAIKI)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "User belum login" }, { status: 401 });

    const body = await req.json();
    // Destructure sesuai dengan yang dikirim dari AdminProducts.tsx
    const { name, price, category_id, unit_id, image, stock, is_decimal } = body;
    const id = `PROD-${Date.now()}`;

    const { error } = await supabaseAdmin
      .from('products')
      .insert([{
        id,
        name,
        price,
        stock,
        image,
        category_id, // Gunakan underscore sesuai screenshot
        unitid: unit_id || 3, // Gunakan unitid (tanpa underscore) sesuai screenshot
        is_decimal: is_decimal ?? false
      }]);

    if (error) throw error;
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal tambah produk' }, { status: 500 });
  }
}

// 3. PUT: Edit Produk (DIPERBAIKI)
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "User belum login" }, { status: 401 });

    const body = await req.json();
    // Ambil is_decimal dari body agar tidak undefined
    const { id, name, price, category_id, unit_id, image, stock, is_decimal } = body;

    const { error } = await supabaseAdmin
      .from('products')
      .update({
        name,
        price,
        stock,
        image,
        category_id, // Nama kolom di DB
        unitid: unit_id || 3, // Nama kolom di DB (tanpa underscore)
        is_decimal: is_decimal ?? false
      })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal update produk' }, { status: 500 });
  }
}

// 4. DELETE: Hapus Produk (SINKRONISASI)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "User belum login" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true }); // Status default 200 OK
  } catch (error) {
    return NextResponse.json({ error: 'Gagal hapus produk' }, { status: 500 });
  }
}