"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type AdminProfile = {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    is_admin: boolean;
    created_at: string;
};

type AdminAuthContextType = {
    user: User | null;
    profile: AdminProfile | null;
    loading: boolean;
    displayName: string;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent stuck loading - reduced to 8s
        const timer = setTimeout(() => {
            if (mounted && loading) {
                console.warn('AdminAuthProvider: Safety timeout reached (8s). Forcefully disabling loading state.');
                setLoading(false);
            }
        }, 8000);

        const fetchProfile = async (u: User | null): Promise<AdminProfile | null> => {
            if (!u) return null;
            try {
                const { data: p, error } = await supabaseAdmin
                    .from('profiles')
                    .select('id, email, full_name, avatar_url, is_admin, created_at')
                    .eq('id', u.id)
                    .single();

                if (error) {
                    console.error('AdminAuthProvider: profile fetch database error', error);
                    return null;
                }

                if (!p?.is_admin) {
                    console.warn('AdminAuthProvider: User is not an admin in DB');
                    return null;
                }
                return p;
            } catch (err) {
                console.error('AdminAuthProvider: profile fetch exception', err);
                return null;
            }
        };

        const load = async () => {
            try {
                console.log('AdminAuthProvider: Starting initial session load');
                const { data: { session }, error: sessionError } = await supabaseAdmin.auth.getSession();

                if (sessionError) {
                    console.error('AdminAuthProvider: getSession error', sessionError);
                }

                const u = session?.user ?? null;
                console.log('AdminAuthProvider: Session load result', { hasUser: !!u });

                if (!mounted) return;

                if (u) {
                    const p = await fetchProfile(u);
                    if (mounted) {
                        if (p) {
                            console.log('AdminAuthProvider: Admin profile verified');
                            setUser(u);
                            setProfile(p);
                        } else {
                            console.log('AdminAuthProvider: Not an admin, clearing local session state');
                            // Specifically NOT blocking on signOut here during load
                            setUser(null);
                            setProfile(null);
                        }
                    }
                }
            } catch (error) {
                console.error('AdminAuthProvider: Unexpected load error', error);
            } finally {
                if (mounted) {
                    console.log('AdminAuthProvider: Initial load sequence complete');
                    clearTimeout(timer);
                    setLoading(false);
                }
            }
        };
        load();

        const { data: { subscription } } = supabaseAdmin.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;
                console.log('AdminAuthProvider: Auth state changed', event);

                const u = session?.user ?? null;
                if (u) {
                    const p = await fetchProfile(u);
                    if (mounted) {
                        if (p) {
                            setUser(u);
                            setProfile(p);
                        } else {
                            await supabaseAdmin.auth.signOut();
                            setUser(null);
                            setProfile(null);
                        }
                    }
                } else {
                    setUser(null);
                    setProfile(null);
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

    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Admin';

    return (
        <AdminAuthContext.Provider value={{ user, profile, loading, displayName }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
}
