import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Build sırasında hata vermemesi için güvenli başlatma
const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
};

export async function POST(request: Request) {
    try {
        const { trackId, userId, amount, currency } = await request.json();

        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase configuration is missing' }, { status: 500 });
        }

        // 1. Fetch Track Details
        const { data: track } = await supabase
            .from('tracks')
            .select('title')
            .eq('id', trackId)
            .single();

        // 2. Fetch Admin Email from Settings
        const { data: settings } = await supabase
            .from('settings')
            .select('contact_email')
            .eq('id', 1)
            .single();

        if (!settings?.contact_email) {
            return NextResponse.json({ error: 'Admin email not found' }, { status: 400 });
        }

        if (!resend) {
            return NextResponse.json({ error: 'Resend API key is missing' }, { status: 500 });
        }

        // 3. Send Email via Resend
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: settings.contact_email,
            subject: `Yeni Satış Bildirimi: ${track?.title || 'Bilinmeyen Eser'}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0b1121; color: #fff;">
                    <h1 style="color: #ede066;">Yeni Satış! 💰</h1>
                    <p style="font-size: 16px;">Tebrikler, bir eseriniz daha satıldı.</p>
                    <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;"><strong>Eser:</strong> ${track?.title || 'Bilinmeyen'}</li>
                        <li style="margin-bottom: 10px;"><strong>Tutar:</strong> ${amount} ${currency}</li>
                        <li style="margin-bottom: 10px;"><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</li>
                    </ul>
                    <div style="margin-top: 30px; padding: 15px; background-color: #151e32; border-radius: 8px; text-align: center;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/analytics" style="color: #ede066; text-decoration: none; font-weight: bold;">Panele Git</a>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('Email Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Notification sent successfully', data });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
