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

// Memory storage fallback for restricted environments (Wix iframes with disabled storage)
const memoryStorage = new Map<string, string>();

// Priority Storage System for restricted environments (Wix iframes)
const customStorage = typeof window !== 'undefined' ? {
  getItem: (key: string) => {
    try {
      // 1. Try local storage (standard)
      let val = window.localStorage.getItem(key);
      if (val) return val;

      // 2. Try session storage (fallback for some iframe restrictions)
      val = window.sessionStorage.getItem(key);
      if (val) return val;

      // 3. Try memory (last resort for very restricted browsers)
      return memoryStorage.get(key) || null;
    } catch {
      return memoryStorage.get(key) || null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
      window.sessionStorage.setItem(key, value); // Mirror to session storage for safety
    } catch {
      memoryStorage.set(key, value);
    }
  },
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  }
} : undefined;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Let SDK handle tokens in URL too
    flowType: 'pkce',
    storageKey: 'muzikbank-auth-token',
    storage: customStorage,
  }
})

// Separate client for password reset emails WITHOUT PKCE.
// Using implicit flow here ensures that Supabase sends recovery links
// that do not require a code_verifier in browser storage.
export const supabaseImplicitForEmail = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storageKey: 'muzikbank-auth-token-email',
    storage: customStorage,
  },
})


