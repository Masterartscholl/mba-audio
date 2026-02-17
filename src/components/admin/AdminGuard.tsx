"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { SkeletonLoader } from './SkeletonLoader';

/**
 * AdminGuard component to protect admin routes.
 * It checks if the user is logged in and is an administrator.
 */
export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, profile, loading } = useAdminAuth();
    const [showRetry, setShowRetry] = React.useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        let timer: any;
        if (loading) {
            timer = setTimeout(() => setShowRetry(true), 10000);
        } else {
            setShowRetry(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => {
        if (pathname === '/admin/login') return;

        if (!loading) {
            if (!user) {
                console.log('AdminGuard: No user, redirecting to admin login');
                router.replace('/admin/login');
            } else if (!profile || !profile.is_admin) {
                console.log('AdminGuard: Not an admin, redirecting to home', { hasProfile: !!profile, isAdmin: profile?.is_admin });
                router.replace('/');
            }
        }
    }, [user, profile, loading, router, pathname]);

    if (pathname === '/admin/login') return <>{children}</>;

    // Show loading skeleton while checking
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-admin-bg">
                <div className="max-w-md w-full p-8 text-center space-y-4">
                    <SkeletonLoader />
                    <p className="text-admin-text-muted text-sm animate-pulse">Erişim kontrol ediliyor...</p>
                    {showRetry && (
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-admin-primary text-admin-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            Sayfayı Yenile
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // If we're not loading and user is an admin, show content
    if (user && profile?.is_admin) {
        return <>{children}</>;
    }

    // Fallback for redirecting state
    return (
        <div className="h-screen w-full bg-admin-bg flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-admin-primary/20 border-t-admin-primary rounded-full animate-spin"></div>
        </div>
    );
};
