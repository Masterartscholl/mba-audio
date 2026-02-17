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

        const fetchProfile = async (u: User | null): Promise<AdminProfile | null> => {
            if (!u) return null;
            try {
                const { data: p, error } = await supabaseAdmin
                    .from('profiles')
                    .select('id, email, full_name, avatar_url, is_admin, created_at')
                    .eq('id', u.id)
                    .single();

                if (error || !p?.is_admin) {
                    // If not an admin, we don't treat them as logged in for admin panel
                    return null;
                }
                return p;
            } catch (err) {
                console.error('AdminAuthProvider: profile fetch error', err);
                return null;
            }
        };

        const load = async () => {
            try {
                const { data: { session } } = await supabaseAdmin.auth.getSession();
                const u = session?.user ?? null;

                if (!mounted) return;

                if (u) {
                    const p = await fetchProfile(u);
                    if (mounted) {
                        if (p) {
                            setUser(u);
                            setProfile(p);
                        } else {
                            // If user is logged into supabaseAdmin but is not an admin in DB, sign them out
                            await supabaseAdmin.auth.signOut();
                            setUser(null);
                            setProfile(null);
                        }
                    }
                }
            } catch (error) {
                console.error('AdminAuthProvider: session load error', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
        load();

        const { data: { subscription } } = supabaseAdmin.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

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
