import { create } from 'zustand';
import { bulkUpdateWebsiteSettings, getWebsiteSettings } from '@/lib/api';
import { uploadInlineImagesInSettings } from '@/lib/settingsImageUpload';

const LOGIN_PAGE_DB_KEY = 'login_page_settings';
const LOGIN_SETTINGS_CACHE_KEY = 'login-page-settings-cache-v1';

const clone = (value) => JSON.parse(JSON.stringify(value));

const safeParse = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const deepMergeWithDefaults = (defaults, overrides) => {
  if (Array.isArray(defaults)) {
    return Array.isArray(overrides) ? overrides : defaults;
  }

  if (defaults && typeof defaults === 'object') {
    const merged = { ...defaults };
    const source = overrides && typeof overrides === 'object' ? overrides : {};

    Object.keys(merged).forEach((key) => {
      merged[key] = deepMergeWithDefaults(merged[key], source[key]);
    });

    Object.keys(source).forEach((key) => {
      if (!(key in merged)) merged[key] = source[key];
    });

    return merged;
  }

  return overrides ?? defaults;
};

const readLoginSettingsCache = () => {
  if (typeof window === 'undefined') return null;

  try {
    const cached = window.localStorage.getItem(LOGIN_SETTINGS_CACHE_KEY);
    return cached ? deepMergeWithDefaults(clone(defaultLoginPageSettings), JSON.parse(cached)) : null;
  } catch {
    return null;
  }
};

const writeLoginSettingsCache = (settings) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(LOGIN_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota/private mode failures.
  }
};

const removeLoginSettingsCache = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(LOGIN_SETTINGS_CACHE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

const withEnabled = (settings) => ({
  enabled: true,
  ...settings,
});

export const defaultLoginPageSettings = {
  media: withEnabled({
    backgroundImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=85',
    floatingImages: [
      { src: 'https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=200&q=80', alt: 'Kebab' },
      { src: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&q=80', alt: 'Baklava' },
      { src: 'https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=200&q=80', alt: 'Falafel' },
      { src: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&q=80', alt: 'Hummus' },
    ],
  }),
  hero: withEnabled({
    badge: 'Sultan Kebab Admin Panel',
    titleTop: 'Kelola Restoran',
    titleAccent: 'Dengan Mudah',
    description: 'Panel admin eksklusif untuk mengelola menu, pesanan, stok, dan laporan Sultan Kebab secara real-time.',
    stats: [
      { value: '12+', label: 'Cabang' },
      { value: '50K+', label: 'Pelanggan' },
      { value: '4.9*', label: 'Rating' },
    ],
  }),
  brand: withEnabled({
    subtitle: 'Admin Dashboard',
  }),
  form: withEnabled({
    title: 'Selamat',
    titleAccent: 'Datang',
    subtitle: 'Masuk ke panel admin untuk mengelola operasional restoran',
    emailLabel: 'Email',
    emailPlaceholder: 'admin@sultankebab.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Masukkan password Anda',
    rememberLabel: 'Ingat saya',
    forgotPasswordLabel: 'Lupa password?',
    forgotPasswordToast: 'Hubungi admin untuk reset password: admin@sultankebab.com',
    submitLabel: 'Masuk ke Dashboard',
    loadingLabel: 'Memverifikasi...',
    dividerText: 'atau kembali ke',
    backLinkLabel: 'Halaman Utama Sultan Kebab',
    successToast: 'Selamat datang, {name}!',
    errorMessage: 'Email atau password salah. Silakan coba lagi.',
  }),
  validation: {
    emailRequired: 'Email tidak boleh kosong',
    emailInvalid: 'Format email tidak valid',
    passwordRequired: 'Password tidak boleh kosong',
    passwordMinLength: 'Password minimal 6 karakter',
  },
  footer: withEnabled({
    text: '2024 Sultan Kebab. Hak cipta dilindungi.',
    version: 'Sistem POS & Admin Panel v2.0',
  }),
};

const normalizeFromApi = (apiSettings) => {
  const base = clone(defaultLoginPageSettings);
  const raw = apiSettings?.[LOGIN_PAGE_DB_KEY];
  const parsed = typeof raw === 'object' ? raw : safeParse(raw);
  if (!parsed || typeof parsed !== 'object') return base;
  return deepMergeWithDefaults(base, parsed);
};

const getInitialLoginSettings = () => readLoginSettingsCache() || clone(defaultLoginPageSettings);

export const useLoginPageSettingsStore = create((set, get) => ({
  settings: getInitialLoginSettings(),
  isDirty: false,
  isSaving: false,
  isLoading: !readLoginSettingsCache(),
  saveError: null,
  loadError: null,
  lastSavedAt: null,
  hasLoaded: Boolean(readLoginSettingsCache()),

  loadSettings: async () => {
    set({ isLoading: true, loadError: null });
    try {
      const response = await getWebsiteSettings();
      const data = response?.data ?? response ?? {};
      const normalized = normalizeFromApi(data);

      set({
        settings: normalized,
        isLoading: false,
        isDirty: false,
        loadError: null,
        hasLoaded: true,
      });
      writeLoginSettingsCache(normalized);

      return normalized;
    } catch (error) {
      const cached = readLoginSettingsCache();
      set({
        settings: cached || get().settings || clone(defaultLoginPageSettings),
        isLoading: false,
        loadError: error?.response?.data?.error || 'Gagal memuat login page settings',
        hasLoaded: Boolean(cached),
      });
      throw error;
    }
  },

  saveSettings: async () => {
    let currentSettings = get().settings;
    set({ isSaving: true, saveError: null });

    try {
      const uploadResult = await uploadInlineImagesInSettings(currentSettings, ['login']);
      currentSettings = uploadResult.value;

      if (uploadResult.changed) {
        set({ settings: currentSettings });
      }

      await bulkUpdateWebsiteSettings([
        {
          setting_key: LOGIN_PAGE_DB_KEY,
          setting_value: JSON.stringify(currentSettings),
          data_type: 'json',
        },
      ]);

      set({
        isSaving: false,
        isDirty: false,
        saveError: null,
        lastSavedAt: new Date(),
      });
      writeLoginSettingsCache(currentSettings);

      return true;
    } catch (error) {
      set({
        isSaving: false,
        saveError: error?.response?.data?.error || 'Gagal menyimpan login page settings',
      });
      return false;
    }
  },

  updateNestedSetting: (path, value) =>
    set((state) => {
      const next = clone(state.settings);
      const keys = path.split('.');
      let current = next;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return { settings: next, isDirty: true };
    }),

  resetSettings: () =>
    {
      removeLoginSettingsCache();
      set({
        settings: clone(defaultLoginPageSettings),
        isDirty: true,
        saveError: null,
      });
    },
}));
