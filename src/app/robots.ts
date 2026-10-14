import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegoldentiger.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/cart', '/checkout', '/order-confirmation', '/admin', '/account'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
