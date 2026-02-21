"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

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
    const pathname = usePathname();

    useEffect(() => {
        let mounted = true;

        // Skip auth initialization for regular user if we are in admin area
        // to prevent double-client resource contention and hangs.
        if (pathname?.startsWith('/admin')) {
            setLoading(false);
            return;
        }

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
                // Add a race against a timeout to prevent hanging the whole app
                const timeoutPromise = new Promise<null>((resolve) =>
                    setTimeout(() => {
                        console.warn('AuthProvider: Profile fetch timed out (5s)');
                        resolve(null);
                    }, 5000)
                );

                const dbPromise = (async () => {
                    try {
                        const { data: p, error } = await supabase
                            .from('profiles')
                            .select('id, email, full_name, avatar_url, is_admin, created_at')
                            .eq('id', u.id)
                            .single();

                        if (error) throw error;
                        profileCache[u.id] = p || null;
                        return p || null;
                    } catch (err) {
                        console.error('AuthProvider: profile fetch error', err);
                        return null;
                    }
                })();

                try {
                    return await Promise.race([dbPromise, timeoutPromise]);
                } finally {
                    delete pendingFetches[u.id];
                }
            })();

            pendingFetches[u.id] = fetchPromise;
            return fetchPromise;
        };

        const load = async () => {
            try {
                // Try getUser first (recommended)
                let { data: { user: u }, error: userError } = await supabase.auth.getUser();

                // Fallback to getSession if getUser fails/returns null
                // This is helpful in iframes where localStorage might have the session 
                // but cookies are lagging or restricted.
                if (!u || userError) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        u = session.user;
                        console.log('AuthProvider: Fallback to session user found');
                    }
                }

                if (!mounted) return;

                setUser(u);
                const p = await fetchProfile(u);
                if (mounted) {
                    setProfile(p);
                    console.log('AuthProvider: Initial load complete', {
                        hasUser: !!u,
                        hasProfile: !!p,
                        userId: u?.id
                    });
                }
            } catch (error) {
                console.error('AuthProvider: getUser/getSession error', error);
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
    }, [pathname]); // Re-initialize if moving out of admin area

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