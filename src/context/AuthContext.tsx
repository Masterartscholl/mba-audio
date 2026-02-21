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
                        const { data: p, error, status } = await supabase
                            .from('profiles')
                            .select('id, email, full_name, avatar_url, is_admin, created_at')
                            .eq('id', u.id)
                            .single();

                        if (error) {
                            console.error(`AuthProvider: Profile fetch error (Status: ${status})`, error);
                            if (status === 401) {
                                console.warn('AuthProvider: 401 Unauthorized - This usually means cookies are blocked or session is invalid in this iframe.');
                            }
                            throw error;
                        }
                        profileCache[u.id] = p || null;
                        return p || null;
                    } catch (err) {
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
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                setLoading(false);
                return;
            }

            // 1. SYNC CHECK: Fast-path for UI
            if (typeof window !== 'undefined') {
                try {
                    const localSessionRaw = localStorage.getItem('muzikbank-auth-token');
                    if (localSessionRaw) {
                        const localSession = JSON.parse(localSessionRaw);
                        if (localSession?.user) {
                            setUser(localSession.user);
                            setLoading(false);
                            console.log('AuthProvider: Sync session detected, UI unlocked');
                        }
                    }
                } catch (e) {
                    console.warn('AuthProvider: Sync session parse error', e);
                }
            }

            let sessionFinished = false;

            // 2. VERIFICATION: In background or race
            const checkSession = async () => {
                try {
                    console.log('AuthProvider: Starting verification from', window.location.pathname);
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    const u = session?.user ?? null;

                    if (!mounted) return;

                    if (u) {
                        setUser(u);
                        setLoading(false);
                        clearTimeout(timer);

                        // Background tasks
                        fetchProfile(u).then(p => {
                            if (mounted) setProfile(p);
                        });

                        supabase.auth.getUser().then(({ data: { user: verifiedUser } }) => {
                            if (mounted && verifiedUser) setUser(verifiedUser);
                        });
                    } else if (sessionError || !u) {
                        // If we have a sync user, don't clear it immediately on error/null from getSession
                        // because getSession can fail for network reasons in an iframe.
                        const currentUser = (await new Promise<User | null>(resolve => {
                            setUser(prev => { resolve(prev); return prev; });
                        }));

                        if (currentUser) {
                            console.warn('AuthProvider: getSession failed but sync user exists. Retrying with getUser...');
                            const { data: { user: verifiedUser } } = await supabase.auth.getUser();
                            if (mounted) {
                                if (verifiedUser) {
                                    setUser(verifiedUser);
                                } else {
                                    console.log('AuthProvider: No session verified, clearing user');
                                    setUser(null);
                                    setProfile(null);
                                }
                                setLoading(false);
                                clearTimeout(timer);
                            }
                        } else {
                            setUser(null);
                            setLoading(false);
                            clearTimeout(timer);
                        }
                    }
                } catch (error) {
                    console.error('AuthProvider: load error', error);
                } finally {
                    sessionFinished = true;
                }
            };

            checkSession();

            // 3. SAFETY: If nothing happens in 2s and we don't even have a sync user, stop spinning
            setTimeout(() => {
                if (mounted && !sessionFinished && !user) {
                    setLoading(false);
                }
            }, 2000);
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