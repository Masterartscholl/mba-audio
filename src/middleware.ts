import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    // 1. Environment Check (Vercel Build Protection)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) return response

    // 2. Initialize Supabase SSR Client
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

    // 3. User & Admin Data (Sadece gerekli durumlarda kontrol etmek için session'ı alıyoruz)
    const { data: { user } } = await supabase.auth.getUser()

    let isAdmin = false
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle()
        isAdmin = profile?.is_admin || false
    }

    // 4. Route Categories
    const isAdminRoute = pathname.startsWith('/admin')
    const isLoginRoute = pathname.startsWith('/login')
    const isMaintenanceRoute = pathname.startsWith('/maintenance')
    const isApiRoute = pathname.startsWith('/api')

    // 5. MAINTENANCE MODE LOGIC
    // Maintenance sayfasının kendisi her zaman erişilebilir olmalı
    if (!isMaintenanceRoute && !isAdminRoute && !isApiRoute && !isLoginRoute) {
        const { data: settings } = await supabase
            .from('settings')
            .select('is_maintenance_mode')
            .eq('id', 1)
            .maybeSingle()

        if (settings?.is_maintenance_mode && !isAdmin) {
            return NextResponse.redirect(new URL('/maintenance', request.url))
        }
    }

    // 6. PROTECT /ADMIN ROUTES
    if (isAdminRoute) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (!isAdmin) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // 7. LOGIN REDIRECTS (Logged in users away from /login)
    if (isLoginRoute && user) {
        return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/', request.url))
    }

    // 8. DEFAULT (Public routes are always accessible)
    return response
}

export const config = {
    matcher: [
        /*
         * Aşağıdaki yollar DIŞINDAKİ tüm yollarda middleware çalışır:
         * - _next/static (static dosyalar)
         * - _next/image (resim optimizasyonu)
         * - favicon.ico, sitemap.xml, robots.txt (statik metadata)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
}
