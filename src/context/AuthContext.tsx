"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    displayName: string;
    avatarUrl: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global cache to prevent duplicate fetches
let profileCache: { [userId: string]: Profile | null } = {};
let pendingFetches: { [userId: string]: Promise<Profile | null> } = {};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Safety timeout
        const timer = setTimeout(() => {
            if (mounted && loading) {
                console.warn('AuthProvider: Loading safety timeout reached (20s). Forcefully disabling loading state.');
                setLoading(false);
            }
        }, 20000);

        const fetchProfile = async (u: User | null): Promise<Profile | null> => {
            if (!u) return null;

            // Return cached profile if available
            if (u.id in profileCache) {
                return profileCache[u.id];
            }

            // If already fetching, wait for that promise
            if (u.id in pendingFetches) {
                return pendingFetches[u.id];
            }

            // Start new fetch
            const fetchPromise = (async () => {
                try {
                    const { data: p } = await supabase
                        .from('profiles')
                        .select('id, email, full_name, avatar_url, is_admin, created_at')
                        .eq('id', u.id)
                        .single();

                    profileCache[u.id] = p || null;
                    return p || null;
                } catch (err) {
                    console.error('AuthProvider: profile fetch error', err);
                    return null;
                } finally {
                    delete pendingFetches[u.id];
                }
            })();

            pendingFetches[u.id] = fetchPromise;
            return fetchPromise;
        };

        const load = async () => {
            try {
                const { data: { user: u } } = await supabase.auth.getUser();
                if (!mounted) return;

                setUser(u);
                const p = await fetchProfile(u);
                if (mounted) {
                    setProfile(p);
                    console.log('AuthProvider: Initial load complete', { hasUser: !!u, hasProfile: !!p });
                }
            } catch (error) {
                console.error('AuthProvider: getUser error', error);
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
                    // Clear cache on logout
                    profileCache = {};
                }

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

    return (
        <AuthContext.Provider value={{ user, profile, loading, displayName, avatarUrl }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
