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
    purchasedTrackIds: number[];
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global cache to prevent duplicate fetches
let profileCache: { [userId: string]: Profile | null } = {};
let pendingFetches: { [userId: string]: Promise<Profile | null> } = {};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [purchasedTrackIds, setPurchasedTrackIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        let mounted = true;

        // Safety timeout - faster to unblock UI
        const timer = setTimeout(() => {
            if (mounted && loading) {
                console.warn('AuthProvider: Loading safety timeout reached (5s). Forcefully disabling loading state.');
                setLoading(false);
            }
        }, 5000);

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
                let timeoutId: any;

                // Add a race against a timeout to prevent hanging the whole app
                const timeoutPromise = new Promise<null>((resolve) => {
                    timeoutId = setTimeout(() => {
                        console.warn('AuthProvider: Profile fetch timed out (8s)');
                        resolve(null);
                    }, 8000);
                });

                const dbPromise = (async () => {
                    try {
                        console.log(`AuthProvider: Fetching profile for user ${u.id}...`);
                        const { data: p, error, status } = await supabase
                            .from('profiles')
                            .select('id, email, full_name, avatar_url, is_admin, created_at')
                            .eq('id', u.id)
                            .single();

                        // Clear the timeout as soon as the database responds
                        if (timeoutId) clearTimeout(timeoutId);

                        if (error) {
                            console.error(`AuthProvider: Profile fetch error (Status: ${status})`, error);
                            if (status === 401) {
                                console.warn('AuthProvider: 401 Unauthorized - This usually means cookies are blocked or session is invalid in this iframe.');
                            }
                            throw error;
                        }

                        console.log(`AuthProvider: Profile fetch success for ${u.id}:`, p);
                        profileCache[u.id] = p || null;
                        return p || null;
                    } catch (err) {
                        if (timeoutId) clearTimeout(timeoutId);
                        console.error(`AuthProvider: Profile fetch catch block for ${u.id}`, err);
                        return null;
                    }
                })();

                try {
                    return await Promise.race([dbPromise, timeoutPromise]);
                } finally {
                    delete pendingFetches[u.id];
                }
            })();

            return fetchPromise;
        };

        const fetchPurchasedTracks = async (u: User) => {
            try {
                // Load from localStorage first for instant display
                const cached = localStorage.getItem('mba_purchased_ids');
                if (cached) {
                    try {
                        const ids = JSON.parse(cached);
                        if (Array.isArray(ids)) {
                            setPurchasedTrackIds(ids);
                        }
                    } catch (e) { /* ignore */ }
                }

                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch('/api/me/purchased-track-ids', { headers });
                const data = await res.json();
                if (data.trackIds && Array.isArray(data.trackIds)) {
                    setPurchasedTrackIds(data.trackIds);
                    localStorage.setItem('mba_purchased_ids', JSON.stringify(data.trackIds));
                }
            } catch (err) {
                console.error('AuthProvider: Failed to fetch purchased tracks', err);
            }
        };

        const load = async () => {
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                setLoading(false);
                return;
            }

            // 1. SYNC CHECK: Fast-path for UI + URL Token extraction
            if (typeof window !== 'undefined') {
                try {
                    // Check URL for tokens passed from same-tab redirect (Wix context)
                    const hash = window.location.hash || '';
                    if (hash.includes('access_token=') || window.location.search.includes('access_token=')) {
                        const params = new URLSearchParams(hash.replace('#', '?') || window.location.search);
                        const at = params.get('access_token');
                        const rt = params.get('refresh_token');

                        if (at && rt) {
                            console.log('AuthProvider: Detected tokens in URL, setting session...');
                            const { data, error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
                            if (!error && data.session) {
                                localStorage.setItem('muzikbank-auth-token', JSON.stringify(data.session));
                                // Clean URL
                                window.history.replaceState(null, '', window.location.pathname);
                                setUser(data.session.user);
                                setLoading(false);
                                return;
                            }
                        }
                    }

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

                        fetchProfile(u).then(p => {
                            if (mounted) setProfile(p);
                        });

                        fetchPurchasedTracks(u);

                        supabase.auth.getUser().then(({ data: { user: verifiedUser } }) => {
                            if (mounted && verifiedUser) setUser(verifiedUser);
                        });
                    } else if (sessionError || !u) {
                        // In an iframe (Wix), server-side session (cookies) often fail.
                        // We must be EXTREMELY careful not to clear a valid sync user from localStorage.
                        const currentUser = (await new Promise<User | null>(resolve => {
                            setUser(prev => { resolve(prev); return prev; });
                        }));

                        if (currentUser) {
                            console.warn('AuthProvider: Server-side check failed, but keeping current Sync User for iframe stability.');
                            // Try one last check with getUser(), which is more robust than getSession() in some SDK versions
                            supabase.auth.getUser().then(({ data: { user: verifiedUser } }) => {
                                if (mounted && verifiedUser) {
                                    setUser(verifiedUser);
                                }
                                // No 'else' here - keep the currentUser as a fallback if getUser() also fails to locate it via cookies
                            });
                            setLoading(false);
                            clearTimeout(timer);
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

                console.log(`AuthProvider: onAuthStateChange event: ${event}`);
                const u = session?.user ?? null;

                if (u) {
                    setUser(u);
                    const p = await fetchProfile(u);
                    if (mounted) setProfile(p);
                    fetchPurchasedTracks(u);
                } else if (event === 'SIGNED_OUT') {
                    // Only clear the user state on an explicit SIGNED_OUT event.
                    // This prevents losing the "Sync User" session in iframes during transient states.
                    setUser(null);
                    setProfile(null);
                    setPurchasedTrackIds([]);
                    localStorage.removeItem('mba_purchased_ids');
                    profileCache = {};
                }

                setLoading(false);
            }
        );

        // --- 4. POPUP MESSAGE LISTENER (Wix Iframe Stability) ---
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'oauth_session') {
                const { access_token, refresh_token } = event.data;
                console.log('AuthProvider: Session received from popup, syncing...');

                try {
                    const { data, error } = await supabase.auth.setSession({
                        access_token,
                        refresh_token
                    });

                    if (!error && data.session) {
                        if (mounted) {
                            const p = await fetchProfile(data.session.user);
                            setProfile(p);
                            fetchPurchasedTracks(data.session.user);
                        }
                        // Ack to the popup so it can close
                        if (event.source && 'postMessage' in event.source) {
                            (event.source as Window).postMessage({ type: 'oauth_session_ack' }, (event.origin as any) || '*');
                        }
                    }
                } catch (e) {
                    console.error('AuthProvider: Popup session sync failed', e);
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            mounted = false;
            clearTimeout(timer);
            subscription.unsubscribe();
            window.removeEventListener('message', handleMessage);
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
        <AuthContext.Provider value={{ user, profile, loading, displayName, avatarUrl, purchasedTrackIds }}>
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