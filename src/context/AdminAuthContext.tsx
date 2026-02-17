"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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

// Global cache for admin profiles
let adminProfileCache: { [userId: string]: AdminProfile | null } = {};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        let mounted = true;

        const fetchProfile = async (u: User | null): Promise<AdminProfile | null> => {
            if (!u) return null;
            if (adminProfileCache[u.id]) return adminProfileCache[u.id];

            try {
                // Wrap the query in a timeout to prevent absolute hangs
                const queryPromise = supabaseAdmin
                    .from('profiles')
                    .select('id, email, full_name, avatar_url, is_admin, created_at')
                    .eq('id', u.id)
                    .single();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
                );

                const { data: p, error } = await (Promise.race([queryPromise, timeoutPromise]) as any);

                if (error || !p?.is_admin) return null;
                adminProfileCache[u.id] = p;
                return p;
            } catch (err) {
                console.warn('AdminAuthProvider: fetchProfile failed or timed out', err);
                return null;
            }
        };

        const updateState = async (u: User | null) => {
            if (!mounted) return;
            const p = await fetchProfile(u);
            if (mounted) {
                setUser(u);
                setUser(u); // Ensure state updates
                setProfile(p);
                setLoading(false);
            }
        };

        const load = async () => {
            try {
                const { data: { session } } = await supabaseAdmin.auth.getSession();
                if (mounted) {
                    await updateState(session?.user ?? null);
                }
            } catch (error) {
                if (mounted) setLoading(false);
            } finally {
                isInitialLoadRef.current = false;
            }
        };

        load();

        const { data: { subscription } } = supabaseAdmin.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;
                console.log('AdminAuthProvider: Auth event', event);

                if (event === 'SIGNED_OUT') {
                    adminProfileCache = {};
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                    await updateState(session?.user ?? null);
                }
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
