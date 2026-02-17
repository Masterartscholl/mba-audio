import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// We create a separate client for admin with a different storage key
// to keep admin and user sessions independent.
export const supabaseAdmin = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'sb-admin-auth-token',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
})
