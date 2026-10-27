export const DEFAULT_THEME_COLORS = {
  primary: '#C9A84C',
  primary_light: '#E8C96A',
  dark: '#0D0A06',
  dark2: '#1A1409',
  dark3: '#241C0E',
  cream: '#F5EDD8',
  cream2: '#EDE0C4',
  accent: '#8B1A1A',
  text: '#F5EDD8',
  text_muted: '#9E8E6E',
};

export const DEFAULT_BRANDING = {
  name: 'Santapos Restaurant',
  short_name: 'Santapos',
  description: 'Sistem POS Kasir dan Self-Order Meja Restoran Modern',
  logo_url: '/images/branding/default-logo.png',
  favicon_url: '/images/branding/default-favicon.ico',
  phone: '',
  email: '',
  address: '',
  ...DEFAULT_THEME_COLORS,
};

export const RESERVED_SUBDOMAINS = new Set([
  'app',
  'admin',
  'api',
  'auth',
  'superadmin',
  'dashboard',
  'static',
  'cdn',
  'assets',
  'staging',
  'dev',
  'demo',
  'www',
  'localhost',
]);
