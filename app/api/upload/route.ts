// app/api/upload/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Persiapan Data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // 2. Kirim ke ImgBB
    const imgBBFormData = new FormData();
    imgBBFormData.append('key', process.env.IMGBB_API_KEY!);
    imgBBFormData.append('image', base64Image);
    imgBBFormData.append('name', `STRUK-${Date.now()}`); // Opsional: Nama file di ImgBB

    // Panggil API Eksternal
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: imgBBFormData,
    });

    const result = await response.json();

    // 3. Cek Error dari ImgBB
    if (!result.success) {
      throw new Error(result.error?.message || 'Gagal upload ke ImgBB');
    }

    // 4. Ambil Link
    // data.url = Link gambar asli (besar)
    // data.display_url = Link gambar yang aman untuk display
    const fileUrl = result.data.url; 

    return NextResponse.json({ 
        success: true, 
        fileUrl: fileUrl 
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}