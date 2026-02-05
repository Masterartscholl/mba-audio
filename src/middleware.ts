import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // EĞER ANAHTARLAR YOKSA HİÇBİR ŞEY YAPMA (Build ve Setup güvenliği)
    if (!supabaseUrl || !supabaseAnonKey) {
        return response
    }

    try {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request: { headers: request.headers } })
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                },
            },
        })

        // Sadece session kontrolü (User objesini al)
        const { data: { user } } = await supabase.auth.getUser()

        // ROTA KONTROLLERİ
        const isAdminRoute = pathname.startsWith('/admin')
        const isLoginRoute = pathname.startsWith('/login')

        if (isAdminRoute && !user) {
            // Admin sayfasına yetkisiz erişim -> Login'e at
            return NextResponse.redirect(new URL('/login', request.url))
        }

        if (isLoginRoute && user) {
            // Zaten giriş yapmışsa Login'den Admin'e at
            return NextResponse.redirect(new URL('/admin', request.url))
        }

    } catch (e) {
        return response
    }

    return response
}

export const config = {
    matcher: [
        /* Metada, statik dosyalar ve resimler haricindeki her şeyi yakala */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
}
