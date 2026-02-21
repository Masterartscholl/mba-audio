import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Iyzipay = require('iyzipay');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || '';

export async function POST(request: NextRequest) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  if (!supabaseAdmin) {
    return NextResponse.redirect(new URL(`${siteUrl}/checkout/failure`), { status: 303 });
  }

  const apiKey = process.env.IYZIPAY_API_KEY;
  const secretKey = process.env.IYZIPAY_SECRET_KEY;
  const baseUrl = process.env.IYZIPAY_BASE_URL || 'https://sandbox-api.iyzipay.com';

  if (!apiKey || !secretKey) {
    console.error('Iyzipay callback error: API anahtarları tanımlı değil');
    return NextResponse.redirect(new URL(`${siteUrl}/checkout/failure`), { status: 303 });
  }

  const iyzipay = new Iyzipay({
    apiKey,
    secretKey,
    uri: baseUrl,
  });

  let token: string | null = null;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      token = (body as any).token ?? null;
    } else {
      const form = await request.formData();
      const raw = form.get('token');
      token = raw ? String(raw) : null;
    }
  } catch {
    token = null;
  }

  if (!token) {
    return NextResponse.redirect(new URL(`${siteUrl}/checkout/failure`), { status: 303 });
  }

  try {
    const retrieveRequest = {
      locale: Iyzipay.LOCALE.TR,
      token,
    };

    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve(retrieveRequest, (err: unknown, res: unknown) => {
        if (err) return reject(err);
        resolve(res as any);
      });
    });

    const paymentStatus = (result.paymentStatus || '').toUpperCase();
    const basketId = result.basketId;
    const orderId = basketId ? Number(basketId) : NaN;

    if (!Number.isFinite(orderId)) {
      return NextResponse.redirect(new URL(`${siteUrl}/checkout/failure`), { status: 303 });
    }

    const newStatus = paymentStatus === 'SUCCESS' ? 'success' : 'failed';

    await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    // Başarılı ödeme için e-posta bildirimleri
    if (newStatus === 'success' && resend) {
      try {
        const { data: orderDetail } = await supabaseAdmin
          .from('orders')
          .select(`
            id,
            amount,
            user_id,
            track_id,
            tracks (
              title
            ),
            profiles (
              email,
              full_name
            )
          `)
          .eq('id', orderId)
          .single();

        if (orderDetail) {
          const trackTitle =
            (orderDetail as any).tracks?.title || 'Bilinmeyen Parça';
          const userEmail =
            (orderDetail as any).profiles?.email || '';
          const userName =
            ((orderDetail as any).profiles?.full_name as string | null) ||
            userEmail?.split('@')[0] ||
            'Müşteri';
          const amountValue = Number((orderDetail as any).amount || 0).toFixed(2);

          const fromAddress = 'MuzikBank <no-reply@muzikbank.net>';

          const userHtml = `
          <html>
            <body style="margin:0;padding:0;background-color:#020617;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#020617;padding:32px 0;">
                <tr>
                  <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#020617,#020617 40%,#020617 100%);border-radius:24px;border:1px solid #1f2937;padding:32px;">
                      <tr>
                        <td align="center" style="padding-bottom:24px;">
                          <div style="width:56px;height:56px;border-radius:999px;background-color:rgba(237,224,102,0.08);border:1px solid rgba(237,224,102,0.5);display:flex;align-items:center;justify-content:center;color:#ede066;font-size:28px;font-weight:900;">
                            MB
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="color:#f9fafb;font-size:18px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;padding-bottom:12px;">
                          Teşekkürler
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="color:#9ca3af;font-size:14px;line-height:1.6;padding-bottom:24px;">
                          Merhaba <span style="color:#f9fafb;font-weight:600;">${userName}</span>,<br/>
                          MüzikBank üzerinden yaptığınız satın alma başarıyla tamamlandı.
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color:rgba(15,23,42,0.9);border-radius:18px;border:1px solid rgba(148,163,184,0.25);padding:16px 20px;color:#e5e7eb;font-size:13px;">
                          <div style="font-size:11px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">
                            Satın Aldığınız Parça
                          </div>
                          <div style="font-weight:600;color:#f9fafb;margin-bottom:4px;">
                            ${trackTitle}
                          </div>
                          <div style="font-size:12px;color:#9ca3af;">
                            Toplam Tutar: <span style="color:#ede066;font-weight:700;">₺${amountValue}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top:28px;">
                          <a href="${siteUrl}/library" style="display:inline-block;padding:12px 28px;border-radius:999px;background-color:#ede066;color:#020617;font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
                            Kütüphaneme Git
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>`;

          const adminHtml = `
          <html>
            <body style="margin:0;padding:0;background-color:#020617;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#020617;padding:32px 0;">
                <tr>
                  <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:#020617;border-radius:24px;border:1px solid #1f2937;padding:24px 24px 20px;">
                      <tr>
                        <td style="color:#f9fafb;font-size:14px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;padding-bottom:8px;">
                          Yeni Satış Yapıldı
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#e5e7eb;font-size:13px;line-height:1.7;padding-bottom:12px;">
                          <strong>${userName}</strong> adlı kullanıcı <strong>${trackTitle}</strong> parçasını satın aldı.
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#9ca3af;">
                          Tutar: <span style="color:#ede066;font-weight:700;">₺${amountValue}</span><br/>
                          Sipariş ID: ${orderId}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>`;

          if (userEmail) {
            await resend.emails.send({
              from: fromAddress,
              to: userEmail,
              subject: 'MüzikBank - Satın alma başarılı',
              html: userHtml,
            });
          }

          if (ADMIN_EMAIL) {
            await resend.emails.send({
              from: fromAddress,
              to: ADMIN_EMAIL,
              subject: `Yeni Satış Yapıldı! ₺${amountValue} - ${userName}`,
              html: adminHtml,
            });
          }
        }
      } catch (mailErr) {
        console.error('Payment email error:', mailErr);
      }
    }

    if (newStatus === 'success') {
      const successUrl = new URL(`${siteUrl}/checkout/success`);
      successUrl.searchParams.set('orderId', String(orderId));
      return NextResponse.redirect(successUrl, { status: 303 });
    }

    return NextResponse.redirect(new URL(`${siteUrl}/checkout/failure`), { status: 303 });
  } catch (err) {
    console.error('Iyzipay callback error:', err);
    return NextResponse.redirect(new URL(`${siteUrl}/checkout/failure`), { status: 303 });
  }
}
