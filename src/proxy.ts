import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_CUSTOMER_ROUTES = ['/library', '/favorites', '/checkout', '/settings']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin');
  const allowedOrigins = ['https://www.muzikburada.net', 'https://mba-audio.vercel.app'];

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Set CORS headers if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info, apikey');
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

    const { data: { user } } = await supabase.auth.getUser()

    const isAdminRoute = pathname.startsWith('/admin')
    const isLoginRoute = pathname === '/login'
    const isSignupRoute = pathname === '/signup'
    const isCustomerProtected = PROTECTED_CUSTOMER_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

    if (isAdminRoute && !user) {
      return NextResponse.redirect(new URL(`/login?returnUrl=${encodeURIComponent('/admin')}`, request.url))
    }

    // Customer route protection is now handled purely on the client-side
    // via CustomerGuard to support iframe environments where third-party cookies
    // might be blocked, rendering server-side authentication checks unreliable.

    if ((isLoginRoute || isSignupRoute) && user) {
      const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/'
      return NextResponse.redirect(new URL(returnUrl, request.url))
    }
  } catch (e) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}

