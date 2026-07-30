import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const baseUrl = (!envUrl || envUrl.includes('localhost')) ? 'https://www.sevikaa.in' : envUrl;
  
  const routes = [
    '',
    '/about',
    '/how-it-works',
    '/pricing',
    '/societies',
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
