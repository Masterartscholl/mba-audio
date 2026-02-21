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
            let hasSessionInLocalStorage = false;
            if (typeof window !== 'undefined') {
                // Aggressive loading state: if a session token exists, assume logged in and set loading to false immediately.
                // This prevents UI blocking while waiting for Supabase to verify the session.
                // Supabase stores its session in localStorage under the key defined in cookieOptions.name, default 'sb-auth-token'.
                hasSessionInLocalStorage = !!localStorage.getItem('sb-auth-token');
                if (hasSessionInLocalStorage) {
                    setLoading(false);
                    clearTimeout(timer); // Clear the safety timeout as we've made a decision
                }

                if (window.location.pathname.startsWith('/admin')) {
                    setLoading(false);
                    return;
                }
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                let u = session?.user ?? null;

                if (u) {
                    const { data: { user: verifiedUser } } = await supabase.auth.getUser();
                    if (verifiedUser) u = verifiedUser;
                }

                if (!mounted) return;
                setUser(u);

                // CRITICAL: Do not wait for profile fetch to turn off loading state.
                // This allows the UI to show immediately if user is found.
                setLoading(false);
                clearTimeout(timer);

                if (u) {
                    const p = await fetchProfile(u);
                    if (mounted) setProfile(p);
                }
            } catch (error) {
                console.error('AuthProvider: load error', error);
                if (mounted) setLoading(false);
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
    }, []); // Run only ONCE on mount

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