import { heroContent } from '@/data/landing/heroContent';
import { locationsContent } from '@/data/landing/locationsContent';
import { menuContent } from '@/data/landing/menuContent';

const DEFAULT_SITE_URL = 'https://restaurant-pos.dev';
const DEFAULT_STORE_NAME = 'Sultan Kebab';
const DEFAULT_DESCRIPTION =
  'Sultan Kebab menyajikan kebab premium, shawarma, menu Timur Tengah, paket spesial, dan pemesanan online dari cabang terdekat.';

const normalizeSiteUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return DEFAULT_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, '');
};

export const getSiteUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return normalizeSiteUrl(explicit || vercel || DEFAULT_SITE_URL);
};

export const getApiBaseUrl = () => {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

export const absoluteUrl = (path = '/', siteUrl = getSiteUrl()) => {
  const value = String(path || '/').trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
};

const pickText = (...values) => {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
};

const isOperationalCopy = (value) => /point\s*of\s*sale|\bpos\b|dashboard|kasir|admin/i.test(String(value || ''));
const detailText = (item = {}) => [item.text, ...(Array.isArray(item.lines) ? item.lines : [])].filter(Boolean).join(' ');
const findAddressDetail = (details = []) =>
  details.find((item) => /jl\.|jalan|mall|district|bandung|jakarta|surabaya|alamat/i.test(detailText(item))) ||
  details.find((item) => item.text);
const findPhoneDetail = (details = []) =>
  details.find((item) => /\+62|whatsapp|reservasi|telp|telepon/i.test(detailText(item)));

export async function getPublicSeoSettings() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch(`${getApiBaseUrl()}/settings`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    if (!response.ok) return {};
    return await response.json();
  } catch (_) {
    return {};
  } finally {
    clearTimeout(timeoutId);
  }
}

export const buildSeoProfile = (settings = {}) => {
  const siteUrl = getSiteUrl();
  const storeName = pickText(settings.store_name, DEFAULT_STORE_NAME);
  const storedTitle = pickText(settings.browser_title);
  const storedDescription = pickText(settings.store_description);
  const browserTitle = isOperationalCopy(storedTitle)
    ? `${storeName} | Kebab Premium & Restoran Timur Tengah`
    : pickText(storedTitle, `${storeName} | Kebab Premium & Restoran Timur Tengah`);
  const description = isOperationalCopy(storedDescription)
    ? DEFAULT_DESCRIPTION
    : pickText(storedDescription, heroContent.subtitle, DEFAULT_DESCRIPTION);
  const heroImage = absoluteUrl(heroContent.backgroundImage, siteUrl);
  const logoUrl = absoluteUrl(settings.logo_url || settings.favicon_url || '/api/app-icon?size=512', siteUrl);
  const firstBranch = locationsContent.branches?.[0] || {};
  const branchDetails = firstBranch.details || [];
  const address = pickText(settings.business_address, findAddressDetail(branchDetails)?.text);
  const phoneDetail = findPhoneDetail(branchDetails);
  const phone = pickText(
    settings.business_phone,
    Array.isArray(phoneDetail?.lines) ? phoneDetail.lines[0] : phoneDetail?.text,
  );
  const menuNames = menuContent.categories.flatMap((category) => category.items.map((item) => item.name));

  return {
    siteUrl,
    storeName,
    browserTitle,
    description,
    heroImage,
    logoUrl,
    address,
    phone,
    keywords: [
      storeName,
      'kebab premium',
      'shawarma',
      'restoran Timur Tengah',
      'kebab Bandung',
      'pesan kebab online',
      ...menuNames.slice(0, 12),
    ],
    branches: locationsContent.branches || [],
    menuNames,
  };
};

export const buildRestaurantJsonLd = (profile) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: profile.storeName,
    url: profile.siteUrl,
    image: [profile.heroImage, profile.logoUrl],
    logo: profile.logoUrl,
    description: profile.description,
    servesCuisine: ['Kebab', 'Shawarma', 'Middle Eastern', 'Turkish'],
    priceRange: 'Rp22.000 - Rp345.000',
    acceptsReservations: true,
    hasMenu: absoluteUrl('/#menu', profile.siteUrl),
    address: profile.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: profile.address,
          addressCountry: 'ID',
        }
      : undefined,
    telephone: profile.phone || undefined,
    department: profile.branches.map((branch) => ({
      '@type': 'Restaurant',
      name: branch.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: findAddressDetail(branch.details)?.text || branch.area || branch.name,
        addressCountry: 'ID',
      },
      url: branch.mapUrl || profile.siteUrl,
      image: branch.gallery?.[0],
    })),
  };

  return Object.fromEntries(Object.entries(jsonLd).filter(([, value]) => value !== undefined));
};
