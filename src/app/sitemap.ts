import { MetadataRoute } from 'next'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.muzikburada.net/muzikbank').replace(/\/$/, '')

  // Static routes
  const routes = [
    '',
    '/auth/login',
    '/auth/signup',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  // Dynamic tracks
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, updated_at')
    .eq('status', 'published')

  const trackRoutes = (tracks || []).map((track) => ({
    url: `${siteUrl}?track=${track.id}`,
    lastModified: new Date(track.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...routes, ...trackRoutes]
}
