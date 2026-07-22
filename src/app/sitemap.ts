import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sevikaa.in';
  
  const routes = [
    '',
    '/about',
    '/how-it-works',
    '/pricing',
    '/safety',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
    '/refunds',
    '/shipping'
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
