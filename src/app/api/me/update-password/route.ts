import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error('API update-password: Missing environment variables');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const { password } = await request.json();

        if (!password || password.length < 6) {
            return NextResponse.json(
                { error: 'Şifre en az 6 karakter olmalıdır.' },
                { status: 400 }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey);
        const authHeader = request.headers.get('Authorization');
        let user = null;

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user: verifiedUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (authError || !verifiedUser) {
                return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
            }
            user = verifiedUser;
        }

        if (!user) {
            return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
        }

        // Şifreyi Admin API ile güncelliyoruz
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: password
        });

        if (updateError) {
            console.error('API Password Update Error:', updateError);
            return NextResponse.json(
                { error: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Şifre başarıyla güncellendi.' });

    } catch (err: any) {
        console.error('Password Update API Catch:', err);
        return NextResponse.json(
            { error: 'Sunucu hatası oluştu.' },
            { status: 500 }
        );
    }
}
