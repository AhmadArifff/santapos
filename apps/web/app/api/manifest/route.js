import { NextResponse } from 'next/server';

const DEFAULT_MANIFEST = {
  name: 'Sultan Kebab',
  short_name: 'Sultan Kebab',
  description: 'Kebab premium, shawarma, menu Timur Tengah, dan pemesanan online Sultan Kebab.',
  icon: '/images/assets/logo.png',
  theme_color: '#C9A84C',
  background_color: '#0D0A06',
};

const getApiBaseUrl = () => {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const pickString = (value, fallback) => {
  const text = String(value || '').trim();
  return text || fallback;
};

const buildManifest = (settings = {}) => {
  const name = pickString(settings.store_name, DEFAULT_MANIFEST.name);
  const description = pickString(settings.store_description, DEFAULT_MANIFEST.description);

  return {
    name,
    short_name: name.slice(0, 30),
    description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: settings.dark || DEFAULT_MANIFEST.background_color,
    theme_color: settings.gold || DEFAULT_MANIFEST.theme_color,
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/api/app-icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/api/app-icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
};

export async function GET() {
  let settings = {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(`${getApiBaseUrl()}/settings`, {
      cache: 'no-store',
      next: { revalidate: 0 },
      signal: controller.signal,
    });
    if (response.ok) settings = await response.json();
  } catch (_) {}
  clearTimeout(timeoutId);

  return NextResponse.json(buildManifest(settings), {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/manifest+json; charset=utf-8',
    },
  });
}
