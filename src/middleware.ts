import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_NAME = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'tr';
const PROTECTED_CUSTOMER_ROUTES = ['/library', '/favorites', '/checkout', '/settings']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const cookies = request.cookies;

    // --- 1. Locale Detection ---
    let queryLocale = request.nextUrl.searchParams.get('lang') || request.nextUrl.searchParams.get('locale');
    let locale = queryLocale || cookies.get(COOKIE_NAME)?.value || DEFAULT_LOCALE;

    if (!['tr', 'en'].includes(locale)) {
        locale = DEFAULT_LOCALE;
    }

    // Initialize response
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    // --- 2. CORS Handling ---
    const origin = request.headers.get('origin');
    const allowedOrigins = ['https://www.muzikburada.net', 'https://mba-audio.vercel.app'];

    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info, apikey');
    }

    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: response.headers,
        });
    }

    // --- 3. Supabase Auth & Redirects ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
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

            const { data: { user } } = await supabase.auth.getUser()

            const isAdminRoute = pathname.startsWith('/admin')
            const isLoginRoute = pathname === '/login'
            const isSignupRoute = pathname === '/signup'

            if (isAdminRoute && !user) {
                return NextResponse.redirect(new URL(`/login?returnUrl=${encodeURIComponent('/admin')}`, request.url))
            }

            if ((isLoginRoute || isSignupRoute) && user) {
                const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/'
                return NextResponse.redirect(new URL(returnUrl, request.url))
            }
        } catch (e) {
            console.error('Middleware auth error:', e)
        }
    }

    // --- 4. Locale Persistence & Headers ---
    if (request.nextUrl.searchParams.has('lang') || request.nextUrl.searchParams.has('locale')) {
        response.cookies.set(COOKIE_NAME, locale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'none',
            secure: true
        });
    }

    response.headers.set('x-next-locale', locale);

    return response;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
