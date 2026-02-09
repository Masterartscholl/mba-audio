import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId: trackIdParam } = await params;
  const trackId = Number(trackIdParam);

  if (!Number.isFinite(trackId)) {
    return NextResponse.json({ error: 'Geçersiz trackId' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
    return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 });
  }

  // Auth için: kullanıcının gerçekten giriş yaptığından emin ol
  const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Bu endpoint cookie güncellemez
      },
    },
  });

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', '/library');
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  // DB ve Storage için admin client
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  // Kullanıcının bu parçayı satın alıp almadığını kontrol et
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, status, track_id')
    .eq('user_id', user.id)
    .eq('status', 'success')
    .eq('track_id', trackId)
    .maybeSingle();

  if (orderError) {
    console.error('Order check error:', orderError);
    return NextResponse.json({ error: 'Sipariş kontrolü yapılamadı' }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: 'Bu parçayı indirme yetkiniz yok' }, { status: 403 });
  }

  // Track master_url bilgisini al
  const { data: track, error: trackError } = await supabaseAdmin
    .from('tracks')
    .select('id, master_url')
    .eq('id', trackId)
    .single();

  if (trackError || !track) {
    return NextResponse.json({ error: 'Parça bulunamadı' }, { status: 404 });
  }

  if (!track.master_url) {
    return NextResponse.json({ error: 'Bu parça için master dosyası yok' }, { status: 404 });
  }

  // 15 dakikalık signed URL üret
  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from('masters')
    .createSignedUrl(track.master_url, 15 * 60);

  if (signedError || !signed?.signedUrl) {
    console.error('Signed URL error:', signedError);
    return NextResponse.json({ error: 'İndirme linki oluşturulamadı' }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl, { status: 303 });
}

