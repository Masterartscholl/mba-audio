import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email' | null
  const next = searchParams.get('next') ?? '/'

  // Both code AND token_hash are missing → nothing we can do
  if (!code && !token_hash) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL(next, request.url))
  }

  const redirectTo = new URL(next, request.url)
  redirectTo.searchParams.set('auth_refresh', '1')
  const response = NextResponse.redirect(redirectTo)

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const safeOptions = {
            ...options,
            sameSite: 'none' as const,
            secure: true,
            httpOnly: true,
            path: options?.path ?? '/',
          }
          response.cookies.set(name, value, safeOptions)
        })
      },
    },
  })

  let data: any = null
  let error: any = null

  if (token_hash && type) {
    // ── EMAIL RECOVERY / MAGIC-LINK FLOW ──────────────────────────────────
    // Supabase emails send `token_hash` + `type` instead of `code`.
    // This does NOT require a PKCE code_verifier, so it works perfectly
    // even when the user clicks the link in a fresh browser tab/session.
    const result = await supabase.auth.verifyOtp({ token_hash, type })
    data = result.data
    error = result.error
  } else if (code) {
    // ── OAUTH / PKCE CODE FLOW ────────────────────────────────────────────
    // Used for Google OAuth and similar flows where the client initiated
    // the flow (and therefore already stored the code_verifier).
    const result = await supabase.auth.exchangeCodeForSession(code)
    data = result.data
    error = result.error
  }

  if (error) {
    console.error('[auth/callback] Exchange/Verify error:', error.message)
    if (next === 'popup') {
      return new NextResponse(
        `<html><body><script>
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth_session_error' }, '*');
            }
            window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }
    // Redirect to login with error message so user gets feedback
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(loginUrl)
  }

  // ── POPUP FLOW (OAuth popup window) ───────────────────────────────────
  if (next === 'popup') {
    const access_token = data?.session?.access_token || ''
    const refresh_token = data?.session?.refresh_token || ''

    return new NextResponse(
      `<html><body>
      <h2 style="font-family: sans-serif; text-align: center; margin-top: 20px;">Giriş başarılı, yönlendiriliyorsunuz...</h2>
      <script>
          let ackReceived = false;

          window.addEventListener('message', (event) => {
              if (event.data?.type === 'oauth_session_ack') {
                  ackReceived = true;
                  window.close();
              }
          });

          if (window.opener && !window.opener.closed) {
            const interval = setInterval(() => {
              if (ackReceived) { clearInterval(interval); return; }
              try {
                window.opener.postMessage({
                  type: 'oauth_session',
                  access_token: '${access_token}',
                  refresh_token: '${refresh_token}'
                }, '*');
              } catch(e) {
                 console.error("Opener postMessage access denied", e);
              }
            }, 300);
            
            setTimeout(() => {
              if (!ackReceived) {
                 clearInterval(interval);
                 window.location.href = '/login?auto=close_popup';
              }
            }, 3000);
          } else {
             window.location.href = '/login?auto=close_popup';
          }
      </script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  return response
}
