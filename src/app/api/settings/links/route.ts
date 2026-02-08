import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

export type LegalLinks = {
    link_privacy_policy: string | null;
    link_distance_selling: string | null;
    link_delivery_return: string | null;
    link_terms_conditions: string | null;
};

export async function GET() {
    try {
        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json({ error: 'Configuration missing' }, { status: 500 });
        }
        const { data, error } = await supabase
            .from('settings')
            .select('link_privacy_policy, link_distance_selling, link_delivery_return, link_terms_conditions')
            .eq('id', 1)
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json((data as LegalLinks) || {});
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
