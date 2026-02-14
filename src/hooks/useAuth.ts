"use client";

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: stop spinner after 10s no matter what
    const timer = setTimeout(() => {
      if (mounted) {
        console.warn('useAuth: Loading safety timeout reached');
        setLoading(false);
      }
    }, 10000);

    const fetchProfile = async (u: User | null) => {
      if (!u) return null;
      try {
        const { data: p } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, is_admin, created_at')
          .eq('id', u.id)
          .single();
        return p;
      } catch (err) {
        console.error('useAuth: profile fetch error', err);
        return null;
      }
    };

    const load = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!mounted) return;

        setUser(u);
        const p = await fetchProfile(u);
        if (mounted) setProfile(p);
      } catch (error) {
        console.error('useAuth: getUser error', error);
      } finally {
        if (mounted) {
          clearTimeout(timer);
          setLoading(false);
        }
      }
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          const p = await fetchProfile(u);
          if (mounted) setProfile(p);
        } else {
          setProfile(null);
        }

        // Ensure loading is false after first state change or check
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const displayName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    '';

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  return { user, profile, loading, displayName, avatarUrl };
}
