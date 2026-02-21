import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (typeof window !== 'undefined') {
  if (!supabaseUrl) {
    console.error('[Supabase] NEXT_PUBLIC_SUPABASE_URL is missing! Client-side queries will fail.')
  }
  if (!supabaseAnonKey) {
    console.error('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing! Client-side queries will fail.')
  }
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'muzikbank-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  cookieOptions: {
    name: 'sb-auth-token',
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }
})
