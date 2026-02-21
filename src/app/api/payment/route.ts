import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// iyzipay, dinamik require kullandığı için webpack bundle'ına dahil etmiyoruz (next.config.mjs ile external).
// Bu yüzden burada runtime'da require ediyoruz.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Iyzipay = require('iyzipay');

type PaymentInitRequest = {
  items: Array<string | number>;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PaymentInitRequest;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'items boş olamaz' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
      return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 });
    }

    // Auth için: kullanıcıyı cookie üzerinden oku veya header'dan Bearer token al
    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Bu endpoint kullanıcı oturumu değiştirmediği için cookie yazmaya gerek yok
        setAll() { },
      },
    });

    // Extract Bearer token from headers (useful for iframe environments where cookies are blocked)
    const authHeader = request.headers.get('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

    // 1) Kullanıcıyı doğrula
    const {
      data: { user },
      error: userError,
    } = token ? await supabaseAuth.auth.getUser(token) : await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });
    }

    /**
     * NOT:
     * Supabase şemanızda `tracks.id` BIGINT ve `orders.track_id` BIGINT.
     * Bu yüzden track id'leri string/uuid gibi ele almak yerine sayı olarak doğruluyoruz.
     */
    const trackIds = Array.from(
      new Set(
        body.items
          .map((id) => Number(id))
          .filter((n) => Number.isFinite(n) && n > 0)
      )
    );
    if (trackIds.length === 0) {
      return NextResponse.json({ error: 'Geçerli track ID bulunamadı' }, { status: 400 });
    }

    // 3) Supabase'ten gerçek fiyatları çek ve toplamı sunucu tarafında hesapla
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { data: tracks, error: tracksError } = await supabaseAdmin
      .from('tracks')
      .select('id, title, price')
      .in('id', trackIds)
      .eq('status', 'published');

    if (tracksError) {
      console.error('Tracks query error in /api/payment:', tracksError);
      return NextResponse.json({ error: 'Parçalar okunamadı' }, { status: 500 });
    }

    if (!tracks || tracks.length === 0) {
      return NextResponse.json({ error: 'Hiçbir parça bulunamadı' }, { status: 400 });
    }

    // İstenilen tüm ID'lerin gerçekten geldiğinden emin ol
    const foundIds = new Set(tracks.map((t) => Number((t as any).id)));
    const missing = trackIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json({ error: 'Bazı parçalar bulunamadı', missing }, { status: 400 });
    }

    const total = tracks.reduce((sum, t: any) => sum + Number((t as any).price || 0), 0);
    // orders tablosunda `currency` NOT NULL görünüyor; her zaman set edilmeli.
    const currency = 'TRY';

    // 3.5) Iyzipay konfigürasyonu (env eksikse erken dön)
    const apiKey = process.env.IYZIPAY_API_KEY;
    const secretKey = process.env.IYZIPAY_SECRET_KEY;
    const baseUrl = process.env.IYZIPAY_BASE_URL || 'https://sandbox-api.iyzipay.com';

    if (!apiKey || !secretKey) {
      console.error('Iyzipay init error: API anahtarları tanımlı değil');
      return NextResponse.json({ error: 'Ödeme servis ayarları eksik' }, { status: 500 });
    }

    const iyzipay = new Iyzipay({
      apiKey,
      secretKey,
      uri: baseUrl,
    });

    // 4) Kullanıcı profilini çek (buyer bilgisi için)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const fullName: string =
      (profile?.full_name && profile.full_name.trim()) ||
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split('@')[0] ||
      'Musteri';

    const [buyerFirstName, ...rest] = fullName.split(' ');
    const buyerLastName = rest.join(' ') || buyerFirstName;

    // 5) Sipariş kaydı (pending)
    const { data: inserted, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        track_id: trackIds[0], // Şu an için sepeti tek track üzerinden temsil ediyoruz
        amount: total,
        currency,
        status: 'pending',
      })
      .select('id')
      .single();

    if (orderError || !inserted) {
      console.error('Order insert error in /api/payment:', orderError);
      return NextResponse.json({ error: 'Sipariş kaydedilemedi' }, { status: 500 });
    }

    const orderId = inserted.id;

    // 6) Iyzipay basketItems oluştur
    const basketItems = tracks.map((t: any) => ({
      id: String(t.id),
      name: t.title || 'Track',
      category1: 'Music',
      category2: 'Beat',
      itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
      price: Number(t.price || 0).toFixed(2),
    }));

    // 7) Iyzipay Checkout Form başlat
    const initializeRequest = {
      locale: (Iyzipay as any).LOCALE.TR,
      conversationId: String(orderId),
      price: total.toFixed(2),
      paidPrice: total.toFixed(2),
      currency: (Iyzipay as any).CURRENCY.TRY,
      basketId: String(orderId),
      paymentGroup: (Iyzipay as any).PAYMENT_GROUP.PRODUCT,
      callbackUrl: process.env.IYZIPAY_CALLBACK_URL || 'http://localhost:3000/api/payment/callback',
      buyer: {
        id: String(user.id),
        name: buyerFirstName,
        surname: buyerLastName || buyerFirstName,
        identityNumber: '11111111111',
        email: profile?.email || user.email || '',
        gsmNumber: user.user_metadata?.phone || '+900000000000',
        registrationAddress: 'Adres',
        ip: request.headers.get('x-forwarded-for') ?? '0.0.0.0',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: fullName,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Adres',
      },
      billingAddress: {
        contactName: fullName,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Adres',
      },
      basketItems,
    };

    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(initializeRequest, (err: unknown, res: unknown) => {
        if (err) return reject(err);
        resolve(res as any);
      });
    });

    if (result.status !== 'success') {
      return NextResponse.json(
        { error: result.errorMessage || 'Ödeme başlatılırken hata oluştu', iyzipayStatus: result.status },
        { status: 400 }
      );
    }

    // Token'ı siparişe yaz (callback'te doğrulama/eşleştirme için faydalı)
    try {
      if (result.token) {
        await supabaseAdmin.from('orders').update({ iyzipay_token: String(result.token) }).eq('id', orderId);
      }
    } catch (e) {
      console.warn('Order token update failed (non-blocking):', e);
    }

    return NextResponse.json({
      orderId,
      token: result.token,
      checkoutFormContent: result.checkoutFormContent,
    });
  } catch (err) {
    console.error('Payment init error:', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

