import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * GET: Giriş yapmış kullanıcının başarıyla satın aldığı track_id listesini döner.
 * Keşfet sayfasında "Satın alındı" göstermek ve sepete eklemeyi engellemek için kullanılır.
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ trackIds: [] }, { status: 200 });
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
    return NextResponse.json({ trackIds: [] }, { status: 200 });
  }

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('track_id')
    .eq('user_id', user.id)
    .eq('status', 'success');


  const trackIds = Array.from(
    new Set((orders as any[] || []).map((o: any) => Number(o.track_id)).filter(Number.isFinite))
  );

  return NextResponse.json({ trackIds }, { status: 200 });
}
