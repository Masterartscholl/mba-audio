import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_CUSTOMER_ROUTES = ['/library', '/favorites', '/checkout', '/settings']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

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

    if (isCustomerProtected && !user) {
      return NextResponse.redirect(new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url))
    }

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
