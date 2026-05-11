import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.muzikburada.net/muzikbank'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/auth/', '/api/me/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
