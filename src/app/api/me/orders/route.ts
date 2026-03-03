import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * GET: Giriş yapmış kullanıcının başarılı siparişlerini ve içindeki track'leri döner.
 * Kütüphane sayfasında listeleme yapmak için kullanılır.
 */
export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ orders: [] }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const authHeader = request.headers.get('Authorization');
    let user = null;

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data: { user: verifiedUser } } = await supabaseAdmin.auth.getUser(token);
        user = verifiedUser;
    } else {
        const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey!, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll() { },
            },
        });
        const { data: { user: verifiedUser } } = await supabaseAuth.auth.getUser();
        user = verifiedUser;
    }

    if (!user) {
        return NextResponse.json({ orders: [] }, { status: 401 });
    }

    // Kullanıcının başarılı siparişlerini getir
    const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
        id,
        amount,
        created_at,
        track_id,
        tracks (
            id,
            title,
            artist_name,
            image_url,
            preview_url,
            bpm,
            price,
            category_id,
            genre_id,
            mode_id,
            categories ( name ),
            genres ( name )
        )
    `)
        .eq('user_id', user.id)
        .eq('status', 'success')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('API Orders error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
}
