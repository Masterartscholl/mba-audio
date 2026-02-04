import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
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
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Fetch Maintenance Mode Status
    const { data: settings } = await supabase
        .from('settings')
        .select('is_maintenance_mode')
        .eq('id', 1)
        .maybeSingle()

    const isMaintenanceMode = settings?.is_maintenance_mode || false

    // 2. Check Admin Status if logged in
    let isAdmin = false
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle()
        isAdmin = profile?.is_admin || false
    }

    const { pathname } = request.nextUrl

    // 3. Maintenance Mode Redirect (Exceptions: /admin, /login, /maintenance, and static assets)
    const isPublicRoute = !pathname.startsWith('/admin') &&
        !pathname.startsWith('/login') &&
        !pathname.startsWith('/maintenance') &&
        !pathname.startsWith('/api') &&
        !pathname.includes('.')

    if (isMaintenanceMode && !isAdmin && isPublicRoute) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
    }

    // Guard: Protect /admin routes
    if (pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        if (!isAdmin) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Guard: Redirect logged in users away from /login
    if (user && pathname.startsWith('/login')) {
        if (isAdmin) {
            return NextResponse.redirect(new URL('/admin', request.url))
        } else {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
