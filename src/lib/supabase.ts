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

// Custom storage manager for iframe/restricted environments
const customStorage = typeof window !== 'undefined' ? {
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {
        // Silent fail
      }
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Silent fail
      }
    }
  }
} : undefined;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storageKey: 'muzikbank-auth-token',
    storage: customStorage,
  }
})

