"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function MaintenanceGuard() {
    const { profile, loading: authLoading } = useAuth();
    const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        async function checkMaintenance() {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('is_maintenance_mode')
                    .eq('id', 1)
                    .maybeSingle();

                if (data) {
                    setMaintenanceMode(data.is_maintenance_mode);
                }
            } catch (err) {
                console.error('Maintenance check error:', err);
            } finally {
                setLoading(false);
            }
        }

        // Don't check maintenance mode on maintenance page itself
        // Or on admin pages
        if (pathname === "/maintenance" || pathname.startsWith("/admin")) {
            setLoading(false);
            return;
        }

        checkMaintenance();

        // Set up real-time listener for maintenance mode
        const channel = supabase
            .channel('public:settings')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'id=eq.1' },
                (payload) => {
                    if (payload.new && typeof payload.new.is_maintenance_mode === 'boolean') {
                        setMaintenanceMode(payload.new.is_maintenance_mode);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pathname]);

    useEffect(() => {
        if (loading || authLoading) return;
        if (maintenanceMode === true && !profile?.is_admin) {
            if (pathname !== "/maintenance" && !pathname.startsWith("/admin")) {
                router.replace("/maintenance");
            }
        } else if (maintenanceMode === false && pathname === "/maintenance") {
            router.replace("/");
        }
    }, [loading, authLoading, maintenanceMode, profile, pathname, router]);

    return null;
}
