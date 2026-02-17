"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SkeletonLoader } from './SkeletonLoader';

/**
 * AdminGuard component to protect admin routes.
 * It checks if the user is logged in and is an administrator.
 */
export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in, redirect to login
                router.replace('/login');
            } else if (!profile || !profile.is_admin) {
                // No profile found OR logged in but not an admin, redirect to home
                // (Note: If there's no profile record for a user, we treat them as non-admin)
                router.replace('/');
            }
        }
    }, [user, profile, loading, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-admin-bg">
                <SkeletonLoader />
            </div>
        );
    }

    // If not loading, we must either have an admin or we are redirecting
    if (!user || !profile?.is_admin) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-admin-bg">
                {/* Empty while redirecting */}
            </div>
        );
    }

    return <>{children}</>;
};
