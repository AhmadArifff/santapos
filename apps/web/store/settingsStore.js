import { create } from 'zustand';
import { getWebsiteSettings } from '@/lib/api';

const WEBSITE_SETTINGS_CACHE_KEY = 'website-settings-cache-v1';

export const DEFAULT_THEME_COLORS = {
  gold: '#C9A84C',
  gold_light: '#E8C96A',
  dark: '#0D0A06',
  dark2: '#1A1409',
  dark3: '#241C0E',
  cream: '#F5EDD8',
  cream2: '#EDE0C4',
  red: '#8B1A1A',
  text: '#F5EDD8',
  text_muted: '#9E8E6E',
};

export const DEFAULT_SETTINGS = {
  store_name: 'Sultan Kebab',
  browser_title: 'Sultan Kebab POS',
  store_description: 'Point of Sale System - Sultan Kebab',
  logo_url: '/images/assets/logo.png',
  favicon_url: '/images/assets/logo.png',
  ...DEFAULT_THEME_COLORS,
  theme_mode: 'dark',
  business_phone: '',
  business_email: '',
  business_address: '',
};

const readSettingsCache = () => {
  if (typeof window === 'undefined') return null;

  try {
    const cached = window.localStorage.getItem(WEBSITE_SETTINGS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const writeSettingsCache = (settings) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(WEBSITE_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota/private mode failures.
  }
};

const removeSettingsCache = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(WEBSITE_SETTINGS_CACHE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

const getInitialSettings = () => ({
  ...DEFAULT_SETTINGS,
  ...(readSettingsCache() || {}),
});

export const useWebsiteSettings = create((set, get) => ({
  settings: getInitialSettings(),
  loading: false,
  error: null,
  loadedAt: null,

  loadSettings: async ({ force = false } = {}) => {
    const current = get();
    if (!force && current.loadedAt) return current.settings;
    if (!force && current.loading) return current.settings;

    set({ loading: true, error: null });
    try {
      const response = await getWebsiteSettings();
      const data = response?.data ?? response ?? {};
      const migratedData = { ...data };

      if (data.primary_color && !data.gold) migratedData.gold = data.primary_color;
      if (data.secondary_color && !data.dark) migratedData.dark = data.secondary_color;
      if (data.accent_color && !data.red) migratedData.red = data.accent_color;

      const normalizedSettings = {
        ...DEFAULT_SETTINGS,
        ...migratedData,
      };

      set({
        settings: normalizedSettings,
        loading: false,
        loadedAt: Date.now(),
      });
      writeSettingsCache(normalizedSettings);
      return normalizedSettings;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal memuat pengaturan website';
      set({
        error: errorMsg,
        loading: false,
      });
      throw err;
    }
  },

  updateSetting: (key, value) => {
    const current = get().settings;
    const next = {
      ...current,
      [key]: value,
    };
    set({ settings: next });
    writeSettingsCache(next);
  },

  updateSettings: (newSettings) => {
    const current = get().settings;
    const next = {
      ...current,
      ...newSettings,
    };
    set({ settings: next });
    writeSettingsCache(next);
  },

  getSetting: (key) => {
    const settings = get().settings;
    return settings[key] || null;
  },

  resetSettings: () => {
    removeSettingsCache();
    set({
      settings: DEFAULT_SETTINGS,
      error: null,
      loadedAt: null,
    });
  },
}));

export default useWebsiteSettings;
