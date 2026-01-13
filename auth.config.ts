import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login', // Halaman login custom kita
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      // Tentukan halaman mana yang boleh diakses tanpa login
      // Di sini kita set hanya halaman '/login' yang boleh.
      const isOnLoginPage = nextUrl.pathname.startsWith('/login');
      
      // Pengecualian untuk folder public images atau API (biasanya dihandle middleware matcher, tapi double check disini aman)
      const isStaticAsset = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.includes('.');

      if (isStaticAsset) return true;

      // KONDISI 1: User sedang di halaman Login
      if (isOnLoginPage) {
        // Jika sudah login, jangan kasih lihat form login lagi, tendang ke Dashboard/Home
        if (isLoggedIn) {
          return Response.redirect(new URL('/', nextUrl)); // Ganti '/' dengan '/dashboard' jika ingin default ke sana
        }
        // Jika belum login, boleh akses halaman login
        return true; 
      }

      // KONDISI 2: User di halaman lain (Dashboard, Transaksi, dll)
      // Jika TIDAK login, tendang balik ke halaman login
      if (!isLoggedIn) {
        return false; // Return false memicu redirect otomatis ke pages.signIn ('/login')
      }

      // KONDISI 3: User sudah login dan ada di halaman terproteksi
      return true;
    },
  },
  providers: [], // Providers kosong wajib untuk auth.config.ts
} satisfies NextAuthConfig;