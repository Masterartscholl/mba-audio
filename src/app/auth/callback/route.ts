import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL(next, request.url))
  }

  const redirectTo = new URL(next, request.url)
  // Client tarafında session'ın kesin okunması için auth_refresh ile yönlendir
  redirectTo.searchParams.set('auth_refresh', '1')
  const response = NextResponse.redirect(redirectTo)

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    redirectTo.searchParams.delete('auth_refresh')
    return NextResponse.redirect(redirectTo)
  }

  // Google ile giriş yapanları ad soyad için ayarlar sayfasına yönlendir (cookie ile client'ta uygulanacak)
  const isGoogle = data?.session?.user?.identities?.some(
    (i: { provider?: string }) => i.provider === 'google'
  )
  if (isGoogle) {
    response.cookies.set('redirect_after_auth', '/settings?complete=1', {
      path: '/',
      maxAge: 60,
      httpOnly: false,
      sameSite: 'lax',
    })
  }

  return response
}
