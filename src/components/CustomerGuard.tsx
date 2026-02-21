"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const PROTECTED_CUSTOMER_ROUTES = ['/library', '/favorites', '/checkout', '/settings'];

/**
 * Protects customer routes dynamically on the client-side.
 * Essential for iframe environments where third-party cookies are blocked,
 * causing server-side authentication (e.g. proxy.ts) to incorrectly identify
 * logged-in users as unauthenticated.
 */
export function CustomerGuard() {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const isCustomerProtected = PROTECTED_CUSTOMER_ROUTES.some(
            (r) => pathname === r || pathname.startsWith(r + '/')
        );

        if (isCustomerProtected && !user) {
            console.warn(`CustomerGuard: Redirecting unauthenticated user from ${pathname} to login`);
            router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        }
    }, [loading, user, pathname, router]);

    return null;
}
