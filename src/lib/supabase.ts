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

// Custom storage manager for iframe/restricted environments
const customStorage = typeof window !== 'undefined' ? {
  getItem: (key: string) => {
    try {
      const val = window.sessionStorage.getItem(key);
      if (val !== null) return val;
      return memoryStorage.get(key) || null;
    } catch {
      return memoryStorage.get(key) || null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Fallback to memory
      memoryStorage.set(key, value);
    }
  },
  removeItem: (key: string) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Fallback to memory
      memoryStorage.delete(key);
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

