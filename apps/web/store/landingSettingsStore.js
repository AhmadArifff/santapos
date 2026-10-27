import { create } from 'zustand';
import { getWebsiteSettings, bulkUpdateWebsiteSettings } from '@/lib/api';
import { uploadInlineImagesInSettings } from '@/lib/settingsImageUpload';
import { headerContent } from '@/data/landing/headerContent';
import { heroContent } from '@/data/landing/heroContent';
import { marqueeContent } from '@/data/landing/marqueeContent';
import { aboutContent } from '@/data/landing/aboutContent';
import { bestsellersContent } from '@/data/landing/bestsellersContent';
import { menuContent } from '@/data/landing/menuContent';
import { experienceContent } from '@/data/landing/experienceContent';
import { galleryContent } from '@/data/landing/galleryContent';
import { locationsContent } from '@/data/landing/locationsContent';
import { testimonialsContent } from '@/data/landing/testimonialsContent';
import { ctaContent } from '@/data/landing/ctaContent';
import { footerContent } from '@/data/landing/footerContent';

const LEGACY_LANDING_SETTINGS_DB_KEY = 'landing_page_settings';
const LANDING_SECTION_DB_KEYS = {
  header: 'landing_header',
  hero: 'landing_hero',
  marquee: 'landing_marquee',
  about: 'landing_about',
  bestsellers: 'landing_bestsellers',
  menuTabs: 'landing_menu_tabs',
  experience: 'landing_experience',
  gallery: 'landing_gallery',
  locations: 'landing_locations',
  testimonials: 'landing_testimonials',
  cta: 'landing_cta',
  footer: 'landing_footer',
  floatButton: 'landing_float_button',
};

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
      if (!(key in merged)) {
        merged[key] = source[key];
      }
    });

    return merged;
  }

  return overrides ?? defaults;
};

const withEnabled = (settings) => ({
  enabled: true,
  ...settings,
});

const normalizeExperienceFeatures = (settings) => {
  const defaultImagesByTitle = new Map(
    (experienceContent.features || []).map((feature) => [feature.title, feature.image || '']),
  );
  const defaultImagesByIcon = new Map([
    ['🏺', defaultImagesByTitle.get('Atmosfer Otentik') || ''],
    ['🌶️', defaultImagesByTitle.get('Rempah Premium Impor') || ''],
    ['🎁', defaultImagesByTitle.get('Private Dining Room') || ''],
    ['🚗', defaultImagesByTitle.get('Delivery & Dine-In') || ''],
  ]);

  const features = Array.isArray(settings?.experience?.features)
    ? settings.experience.features
    : [];

  return {
    ...settings,
    experience: {
      ...settings.experience,
      features: features.map((feature) => ({
        ...feature,
        image: feature.image || defaultImagesByTitle.get(feature.title) || defaultImagesByIcon.get(feature.icon) || '',
      })),
    },
  };
};

const defaultLandingSettings = {
  header: withEnabled({
    logo: {
      part1: headerContent.logo || 'SULTAN',
      part2: headerContent.logoSpan || 'KEBAB',
    },
    navLinks: headerContent.navLinks || [],
    buttons: {
      cta: {
        label: headerContent.ctaButton?.label || 'Pesan Sekarang',
        href: headerContent.ctaButton?.href || 'https://wa.me/6281234567890',
      },
      admin: {
        label: headerContent.adminButton?.label || 'Login Admin',
        href: headerContent.adminButton?.href || '/login',
      },
    },
  }),
  hero: withEnabled({
    backgroundImage: heroContent.backgroundImage || '',
    badge: heroContent.badge || '',
    title: {
      part1: heroContent.titleTop || '',
      part2: heroContent.titleAccent || '',
      part3: heroContent.titleBottom || '',
    },
    subtitle: heroContent.subtitle || '',
    buttons: {
      primary: {
        label: heroContent.ctaPrimary?.label || 'Lihat Menu',
        href: heroContent.ctaPrimary?.href || '#menu',
      },
      secondary: {
        label: heroContent.ctaSecondary?.label || 'Temukan Cabang',
        href: heroContent.ctaSecondary?.href || '#locations',
      },
    },
    stats: (heroContent.stats || []).map((stat) => ({
      value: stat.value ?? stat.text ?? '',
      suffix: stat.suffix || '',
      label: stat.label || '',
    })),
  }),
  marquee: withEnabled({
    items: marqueeContent.items || [],
    dot: marqueeContent.dot || '*',
  }),
  about: withEnabled({
    sectionLabel: aboutContent.sectionLabel || '',
    title: aboutContent.title || '',
    highlight: aboutContent.highlight || '',
    description: aboutContent.description || '',
    mainImage: aboutContent.mainImage || '',
    accentImage: aboutContent.accentImage || '',
    badgeTop: aboutContent.badgeTop || '',
    badgeBottom: aboutContent.badgeBottom || '',
    features: aboutContent.features || [],
  }),
  bestsellers: withEnabled({
    sectionLabel: bestsellersContent.sectionLabel || '',
    title: bestsellersContent.title || '',
    highlight: bestsellersContent.highlight || '',
    description: bestsellersContent.description || '',
    products: bestsellersContent.products || [],
  }),
  menuTabs: withEnabled({
    sectionLabel: menuContent.sectionLabel || '',
    title: menuContent.title || '',
    highlight: menuContent.highlight || '',
    description: menuContent.description || '',
    categories: menuContent.categories || [],
  }),
  experience: withEnabled({
    sectionLabel: experienceContent.sectionLabel || '',
    title: experienceContent.title || '',
    highlight: experienceContent.highlight || '',
    subtitle: experienceContent.subtitle || '',
    features: experienceContent.features || [],
  }),
  gallery: withEnabled({
    images: galleryContent.images || [],
  }),
  locations: withEnabled({
    sectionLabel: locationsContent.sectionLabel || '',
    title: locationsContent.title || '',
    highlight: locationsContent.highlight || '',
    subtitle: locationsContent.subtitle || '',
    description: locationsContent.description || '',
    branches: locationsContent.branches || [],
  }),
  testimonials: withEnabled({
    sectionLabel: testimonialsContent.sectionLabel || '',
    title: testimonialsContent.title || '',
    highlight: testimonialsContent.highlight || '',
    description: testimonialsContent.description || '',
    items: testimonialsContent.items || [],
  }),
  cta: withEnabled({
    backgroundImage: ctaContent.backgroundImage || '',
    sectionLabel: ctaContent.sectionLabel || '',
    title: ctaContent.title || '',
    highlight: ctaContent.highlight || '',
    description: ctaContent.description || '',
    whatsappUrl: ctaContent.whatsappUrl || '',
    secondaryButton: ctaContent.secondaryButton || { label: '', href: '' },
    deliveryPlatforms: ctaContent.deliveryPlatforms || [],
  }),
  footer: withEnabled({
    brand: footerContent.brand || '',
    brandDescription: footerContent.brandDescription || '',
    socialLinks: footerContent.socialLinks || [],
    columns: footerContent.columns || [],
    copyright: footerContent.copyright || '',
    note: footerContent.note || '',
  }),
  floatButton: withEnabled({
    href: ctaContent.whatsappUrl || '',
    icon: 'Chat',
    ariaLabel: 'Pesan via WhatsApp',
  }),
};

const normalizeFromApi = (apiSettings) => {
  const base = clone(defaultLandingSettings);
  if (!apiSettings || typeof apiSettings !== 'object') return base;

  // Preferred format: one row per landing section key (same pattern as admin settings menu)
  const perSectionMerged = clone(base);
  let hasPerSectionData = false;

  Object.entries(LANDING_SECTION_DB_KEYS).forEach(([section, dbKey]) => {
    const sectionRaw = apiSettings[dbKey];
    if (!sectionRaw) return;

    const parsed = typeof sectionRaw === 'object' ? sectionRaw : safeParse(sectionRaw);
    if (!parsed || typeof parsed !== 'object') return;

    perSectionMerged[section] = deepMergeWithDefaults(base[section], parsed);
    hasPerSectionData = true;
  });

  if (hasPerSectionData) return normalizeExperienceFeatures(perSectionMerged);

  // Backward compatibility: single JSON blob key
  const legacyRaw = apiSettings[LEGACY_LANDING_SETTINGS_DB_KEY];
  const legacyParsed = typeof legacyRaw === 'object' ? legacyRaw : safeParse(legacyRaw);
  if (!legacyParsed || typeof legacyParsed !== 'object') return base;

  return normalizeExperienceFeatures(deepMergeWithDefaults(base, legacyParsed));
};

export const useLandingSettingsStore = create((set, get) => ({
  settings: clone(defaultLandingSettings),
  isDirty: false,
  isSaving: false,
  isLoading: false,
  saveError: null,
  loadError: null,
  lastSavedAt: null,
  hasLoaded: false,

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

      return normalized;
    } catch (error) {
      set({
        settings: clone(defaultLandingSettings),
        isLoading: false,
        loadError: error?.response?.data?.error || 'Gagal memuat landing page settings',
        hasLoaded: false,
      });
      throw error;
    }
  },

  saveSettings: async () => {
    let currentSettings = get().settings;
    set({ isSaving: true, saveError: null });

    try {
      const uploadResult = await uploadInlineImagesInSettings(currentSettings, ['landing']);
      currentSettings = uploadResult.value;

      if (uploadResult.changed) {
        set({ settings: currentSettings });
      }

      const payload = Object.entries(LANDING_SECTION_DB_KEYS).map(([section, dbKey]) => ({
        setting_key: dbKey,
        setting_value: JSON.stringify(currentSettings[section] ?? {}),
        data_type: 'json',
      }));

      await bulkUpdateWebsiteSettings(payload);

      set({
        isSaving: false,
        isDirty: false,
        saveError: null,
        lastSavedAt: new Date(),
      });

      return true;
    } catch (error) {
      set({
        isSaving: false,
        saveError: error?.response?.data?.error || 'Gagal menyimpan landing page settings',
      });
      return false;
    }
  },

  updateSettings: (section, data) =>
    set((state) => ({
      settings: {
        ...state.settings,
        [section]: { ...state.settings[section], ...data },
      },
      isDirty: true,
    })),

  updateNestedSetting: (section, path, value) =>
    set((state) => {
      const newSettings = clone(state.settings);
      const keys = path.split('.');
      let current = newSettings[section];

      if (!current || typeof current !== 'object') {
        newSettings[section] = {};
        current = newSettings[section];
      }

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      return {
        settings: newSettings,
        isDirty: true,
      };
    }),

  updateArrayItem: (section, arrayPath, index, itemData) =>
    set((state) => {
      const newSettings = clone(state.settings);
      const keys = arrayPath.split('.');
      let current = newSettings[section];

      for (let i = 0; i < keys.length; i++) {
        current = current[keys[i]];
      }

      if (!Array.isArray(current) || !current[index]) return state;

      current[index] = { ...current[index], ...itemData };

      return {
        settings: newSettings,
        isDirty: true,
      };
    }),

  addArrayItem: (section, arrayPath, newItem) =>
    set((state) => {
      const newSettings = clone(state.settings);
      const keys = arrayPath.split('.');
      let current = newSettings[section];

      for (let i = 0; i < keys.length; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = [];
        }
        current = current[keys[i]];
      }

      if (!Array.isArray(current)) return state;
      current.push(newItem);

      return {
        settings: newSettings,
        isDirty: true,
      };
    }),

  removeArrayItem: (section, arrayPath, index) =>
    set((state) => {
      const newSettings = clone(state.settings);
      const keys = arrayPath.split('.');
      let current = newSettings[section];

      for (let i = 0; i < keys.length; i++) {
        current = current[keys[i]];
      }

      if (!Array.isArray(current)) return state;
      current.splice(index, 1);

      return {
        settings: newSettings,
        isDirty: true,
      };
    }),

  resetSettings: () =>
    set({
      settings: clone(defaultLandingSettings),
      isDirty: false,
      saveError: null,
    }),

  getSettings: () => get().settings,
  getSection: (section) => get().settings[section],
  getIsDirty: () => get().isDirty,
}));
