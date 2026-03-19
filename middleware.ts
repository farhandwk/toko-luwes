import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Cek User
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isOnLoginPage = url.pathname.startsWith('/login')

  // 2. LOGIKA REDIRECT (Pindahan dari auth.config.ts)

  // KONDISI A: User belum login dan mencoba akses halaman terproteksi
  if (!user && !isOnLoginPage) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // KONDISI B: User sudah login tapi mencoba buka halaman /login lagi
  if (user && isOnLoginPage) {
    url.pathname = '/' // Tendang ke dashboard/home
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match semua request kecuali:
     * - api (api routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo, dll (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}