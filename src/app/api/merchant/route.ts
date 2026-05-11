import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    try {
        // 1. Fetch site settings for currency
        const { data: settings } = await supabase
            .from('settings')
            .select('currency')
            .eq('id', 1)
            .maybeSingle();

        // Google requires ISO 4217 currency codes
        const rawCurrency = settings?.currency || 'TRY';
        const currency = rawCurrency === 'TL' ? 'TRY' : rawCurrency;
        const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.muzikburada.net/muzikbank').replace(/\/$/, '');

        // 2. Fetch all published tracks
        const { data: tracks, error } = await supabase
            .from('tracks')
            .select(`
                id,
                title,
                artist_name,
                image_url,
                price,
                bpm,
                genres(name, name_en),
                categories(name, name_en)
            `)
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 3. Build XML - Ensure NO leading whitespace
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
  <channel>
    <title>MBA Audio</title>
    <link>${siteUrl}</link>
    <description>Müzik Burada - Profesyonel Audio Library</description>
    <atom:link href="${siteUrl}/api/merchant" rel="self" type="application/rss+xml" />
`;
xml = xml.trimStart();

        if (tracks) {
            for (const track of tracks) {
                const title = escapeXml(track.title);
                const artist = escapeXml(track.artist_name || 'MBA Audio');
                const genre = track.genres ? escapeXml((track.genres as any).name) : 'Audio';
                const description = escapeXml(`${artist} - ${genre} - ${track.bpm || ''} BPM Professional Audio Track`);
                const link = `${siteUrl}?track=${track.id}`;
                const imageUrl = track.image_url || `${siteUrl}/favicon.ico`;
                const price = `${track.price || 0} ${currency}`;

                xml += `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <guid isPermaLink="false">track_${track.id}</guid>
      <g:id>${track.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${price}</g:price>
      <g:brand>MBA Audio</g:brand>
      <g:google_product_category>731</g:google_product_category>
    </item>\n`;
            }
        }

        xml += `  </channel>
</rss>`;

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
            },
        });
    } catch (error: any) {
        console.error('Merchant XML Error:', error);
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}

function escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
}
