// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Konversi File ke Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload ke Cloudinary menggunakan Stream
    // Kita bungkus dalam Promise agar bisa di-await
    const uploadResponse: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'pos-toko-luwes', // Nama folder di Cloudinary (Opsional)
          resource_type: 'auto',   // Otomatis deteksi jpg/png
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Akhiri stream dengan buffer file kita
      uploadStream.end(buffer);
    });

    // Sukses! Kembalikan URL HTTPS yang aman
    return NextResponse.json({
      success: true,
      fileUrl: uploadResponse.secure_url, // URL HTTPS Cloudinary
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}