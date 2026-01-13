// app/api/image-proxy/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL wajib ada' }, { status: 400 });
  }

  try {
    // 💡 SOLUSI AJAIB:
    // Kita bungkus URL ImgBB dengan layanan 'wsrv.nl'.
    // Layanan ini bertindak sebagai "Mirror" yang tidak diblokir di Indonesia.
    // &n=-1 artinya: Jangan kompresi gambar (biarkan original).
    const mirrorUrl = `https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}&n=-1`;

    console.log("🔄 Fetching via Mirror:", mirrorUrl);

    const response = await fetch(mirrorUrl);
    
    if (!response.ok) {
        throw new Error(`Gagal fetch dari Mirror. Status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Ambil content-type dari respon mirror, atau default ke png
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error("🔥 Proxy Error:", error.message);
    return NextResponse.json({ error: 'Gagal memuat gambar' }, { status: 500 });
  }
}