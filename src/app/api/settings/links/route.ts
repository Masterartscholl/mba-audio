import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

export type LegalLinks = {
    link_privacy_policy: string | null;
    link_distance_selling: string | null;
    link_delivery_return: string | null;
    link_terms_conditions: string | null;
    link_explicit_consent: string | null;
};

export async function GET() {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json({ error: 'Configuration missing' }, { status: 500 });
        }
        let { data, error } = await supabase
            .from('settings')
            .select('link_privacy_policy, link_distance_selling, link_delivery_return, link_terms_conditions, link_explicit_consent')
            .eq('id', 1)
            .maybeSingle();

        // Backward compatibility for databases that don't have link_explicit_consent yet.
        if (error?.message?.includes('link_explicit_consent')) {
            const fallback = await supabase
                .from('settings')
                .select('link_privacy_policy, link_distance_selling, link_delivery_return, link_terms_conditions')
                .eq('id', 1)
                .maybeSingle();
            data = fallback.data ? { ...fallback.data, link_explicit_consent: null } : null;
            error = fallback.error;
        }

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json((data as LegalLinks) || {}, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
