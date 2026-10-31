import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Kisaan Sevak – Smart Farming Assistant',
    short_name: 'Kisaan Sevak',
    description:
      'AI crop diagnosis, soil and irrigation advice, farm schedules, records and a farmer-to-buyer marketplace, in 9 Indian languages.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F6F6DF',
    theme_color: '#4A824A',
    lang: 'en-IN',
    categories: ['productivity', 'business', 'education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
