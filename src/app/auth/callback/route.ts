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

  // Artık Google kullanıcılarını zorunlu olarak /settings?complete=1 sayfasına yönlendirmiyoruz.
  // Sadece auth_refresh ile belirtilen hedef sayfaya dönüyoruz.
  return response
}
