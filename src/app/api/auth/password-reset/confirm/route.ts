import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase credentials are not configured');
  }

  return createClient(supabaseUrl, serviceKey);
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Geçersiz bağlantı.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // 1. Token kaydını bul
    const { data: resetRow, error: resetError } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used')
      .eq('token', token)
      .maybeSingle();

    if (resetError) {
      console.error('[password-reset/confirm] select error:', resetError);
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş bağlantı.' }, { status: 400 });
    }

    if (!resetRow) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş bağlantı.' }, { status: 400 });
    }

    if (resetRow.used) {
      return NextResponse.json({ error: 'Bu bağlantı zaten kullanılmış.' }, { status: 400 });
    }

    if (resetRow.expires_at && new Date(resetRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Bu bağlantının süresi dolmuş.' }, { status: 400 });
    }

    // 2. Şifreyi Admin API ile güncelle
    const { error: updateError } = await supabase.auth.admin.updateUserById(resetRow.user_id, {
      password,
    });

    if (updateError) {
      console.error('[password-reset/confirm] update error:', updateError);
      return NextResponse.json({ error: 'Şifre güncellenemedi.' }, { status: 500 });
    }

    // 3. Tokeni kullanılmış işaretle
    const { error: markError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetRow.id);

    if (markError) {
      console.error('[password-reset/confirm] mark used error:', markError);
      // Devam etmeye engel değil, sadece logla
    }

    return NextResponse.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error: any) {
    console.error('[password-reset/confirm] unexpected error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}

