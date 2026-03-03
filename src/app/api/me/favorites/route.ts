import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * GET: Kullanıcının favorilerini getir.
 * POST: Favori ekle.
 * DELETE: Favori sil.
 */
export async function GET(request: NextRequest) {
    const { user, supabaseAdmin } = await getAuthAndAdmin(request);
    if (!user) return NextResponse.json({ favorites: [] }, { status: 401 });

    const { data, error } = await supabaseAdmin
        .from('user_favorites')
        .select('track_id, tracks (*)')
        .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const favorites = data?.map((item: any) => item.tracks).filter(Boolean) || [];
    return NextResponse.json({ favorites });
}

export async function POST(request: NextRequest) {
    const { user, supabaseAdmin } = await getAuthAndAdmin(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { trackId } = await request.json();
    if (!trackId) return NextResponse.json({ error: 'trackId required' }, { status: 400 });

    const { error } = await supabaseAdmin
        .from('user_favorites')
        .upsert({ user_id: user.id, track_id: trackId }, { onConflict: 'user_id,track_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
    const { user, supabaseAdmin } = await getAuthAndAdmin(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');
    if (!trackId) return NextResponse.json({ error: 'trackId required' }, { status: 400 });

    const { error } = await supabaseAdmin
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', trackId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

async function getAuthAndAdmin(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const authHeader = request.headers.get('Authorization');
    let user = null;

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data: { user: verifiedUser } } = await supabaseAdmin.auth.getUser(token);
        user = verifiedUser;
    } else {
        const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll() { },
            },
        });
        const { data: { user: verifiedUser } } = await supabaseAuth.auth.getUser();
        user = verifiedUser;
    }

    return { user, supabaseAdmin };
}
