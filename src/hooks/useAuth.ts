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
    const load = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        setUser(u);
        if (u) {
          const { data: p } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, is_admin, created_at')
            .eq('id', u.id)
            .single();
          setProfile(p ?? null);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('useAuth getUser error:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          const u = session?.user ?? null;
          setUser(u);
          if (u) {
            const { data: p } = await supabase
              .from('profiles')
              .select('id, email, full_name, avatar_url, is_admin, created_at')
              .eq('id', u.id)
              .single();
            setProfile(p ?? null);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('useAuth onAuthStateChange error:', error);
          setUser(null);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
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
