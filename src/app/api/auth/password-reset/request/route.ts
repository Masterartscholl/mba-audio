import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;
const smtpSecure = process.env.SMTP_SECURE;

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase credentials are not configured');
  }

  return createClient(supabaseUrl, serviceKey);
}

function getTransporter() {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error('SMTP credentials are not configured');
  }

  const port = Number(smtpPort);

  return nodemailer.createTransport({
    host: smtpHost,
    port,
    secure: smtpSecure === 'true' || port === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Geçerli bir e-posta giriniz.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = getServiceClient();

    // 1. Kullanıcıyı e-posta ile bul (profiles tablosu üzerinden)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error('[password-reset/request] profile error:', profileError);
      // Kullanıcı olup olmadığını sızdırmamak için generic cevap döndür.
      return NextResponse.json({ success: true });
    }

    if (!profile) {
      // Güvenlik için yine de success dön (kullanıcı yoksa bile)
      return NextResponse.json({ success: true });
    }

    // 2. Token üret ve password_reset_tokens tablosuna kaydet
    const token = crypto.randomUUID() + '-' + Buffer.from(normalizedEmail).toString('hex').slice(0, 16);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 saat

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: profile.id,
        token,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('[password-reset/request] insert error:', insertError);
      return NextResponse.json({ error: 'Şifre sıfırlama isteği oluşturulamadı.' }, { status: 500 });
    }

    // 3. Vercel app URL'si üzerinden reset-password sayfasına yönlendiren link
    const appBase =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://mba-audio.vercel.app';

    const resetUrl = `${appBase}/reset-password?token=${encodeURIComponent(token)}`;

    // 4. E-posta gönder (SMTP ile - Gmail / Outlook vb.)
    const transporter = getTransporter();

    const toEmail = profile.email || normalizedEmail;
    const displayName = profile.full_name || toEmail;

    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject: 'Şifre Sıfırlama Talebiniz',
        html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#020617; color:#e5e7eb; padding:24px;">
          <h1 style="color:#ede066; font-size:20px; margin-bottom:16px;">Şifre Sıfırlama</h1>
          <p style="font-size:14px; margin-bottom:12px;">Merhaba ${displayName},</p>
          <p style="font-size:14px; margin-bottom:12px;">
            MüzikBank hesabınız için bir şifre sıfırlama isteği aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
          </p>
          <p style="font-size:13px; margin-bottom:16px; color:#9ca3af;">
            Bu bağlantı ${60} dakika boyunca geçerlidir. Eğer bu isteği siz yapmadıysanız, bu e-postayı yok sayabilirsiniz.
          </p>
          <div style="margin:24px 0;">
            <a href="${resetUrl}"
               style="background:#ede066; color:#020617; text-decoration:none; padding:10px 18px; border-radius:999px; font-weight:600; font-size:14px; display:inline-block;">
              Şifremi Sıfırla
            </a>
          </div>
          <p style="font-size:12px; color:#6b7280;">
            Butona tıklayamazsanız, aşağıdaki bağlantıyı tarayıcınıza yapıştırabilirsiniz:<br/>
            <span style="word-break:break-all; color:#9ca3af;">${resetUrl}</span>
          </p>
        </div>
      `,
      });
    } catch (emailError: any) {
      console.error('[password-reset/request] email error:', emailError);
      return NextResponse.json(
        { error: 'Şifre sıfırlama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[password-reset/request] unexpected error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}

