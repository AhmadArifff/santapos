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

const deepMerge = (defaults, overrides) => {
  if (Array.isArray(defaults)) {
    return Array.isArray(overrides) ? overrides : defaults;
  }

  if (defaults && typeof defaults === 'object') {
    const merged = { ...defaults };
    const source = overrides && typeof overrides === 'object' ? overrides : {};

    Object.keys(merged).forEach((key) => {
      merged[key] = deepMerge(merged[key], source[key]);
    });

    Object.keys(source).forEach((key) => {
      if (!(key in merged)) merged[key] = source[key];
    });

    return merged;
  }

  return overrides ?? defaults;
};

const baseContent = {
  header: clone(headerContent),
  hero: clone(heroContent),
  marquee: clone(marqueeContent),
  about: clone(aboutContent),
  bestsellers: clone(bestsellersContent),
  menuTabs: clone(menuContent),
  experience: clone(experienceContent),
  gallery: clone(galleryContent),
  locations: clone(locationsContent),
  testimonials: clone(testimonialsContent),
  cta: clone(ctaContent),
  footer: clone(footerContent),
  floatButton: {
    whatsappUrl: ctaContent.whatsappUrl,
    icon: '💬',
    ariaLabel: 'Pesan via WhatsApp',
  },
};

const isEnabled = (section) => section?.enabled !== false;

const resolvePersistedSections = (websiteSettings) => {
  if (!websiteSettings || typeof websiteSettings !== 'object') return {};

  const result = {};
  let hasPerSection = false;

  Object.entries(LANDING_SECTION_DB_KEYS).forEach(([section, dbKey]) => {
    const raw = websiteSettings[dbKey];
    if (!raw) return;
    const parsed = typeof raw === 'object' ? raw : safeParse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    result[section] = parsed;
    hasPerSection = true;
  });

  if (hasPerSection) return result;

  const legacyRaw = websiteSettings[LEGACY_LANDING_SETTINGS_DB_KEY];
  const legacyParsed = typeof legacyRaw === 'object' ? legacyRaw : safeParse(legacyRaw);
  if (!legacyParsed || typeof legacyParsed !== 'object') return {};

  return legacyParsed;
};

export function getDefaultLandingContent() {
  return clone(baseContent);
}

export function resolveLandingContentFromSettings(websiteSettings) {
  const persisted = resolvePersistedSections(websiteSettings);

  const header = persisted.header || {};
  const hero = persisted.hero || {};
  const cta = deepMerge(baseContent.cta, persisted.cta || {});

  const heroStats = (hero.stats && hero.stats.length ? hero.stats : baseContent.hero.stats).map((stat) => {
    if (typeof stat?.value === 'string' && !stat?.suffix) {
      return {
        ...stat,
        text: stat.value,
      };
    }
    return stat;
  });

  const content = {
    header: {
      enabled: isEnabled(header),
      logo: header.logo?.part1 ?? baseContent.header.logo,
      logoSpan: header.logo?.part2 ?? baseContent.header.logoSpan,
      navLinks: Array.isArray(header.navLinks) && header.navLinks.length > 0 ? header.navLinks : baseContent.header.navLinks,
      ctaButton: deepMerge(baseContent.header.ctaButton, header.buttons?.cta || {}),
      adminButton: deepMerge(baseContent.header.adminButton, header.buttons?.admin || {}),
      mobileCta: deepMerge(baseContent.header.mobileCta, header.buttons?.cta || {}),
      mobileAdminButton: deepMerge(baseContent.header.mobileAdminButton, header.buttons?.admin || {}),
    },
    hero: {
      enabled: isEnabled(hero),
      backgroundImage: hero.backgroundImage ?? baseContent.hero.backgroundImage,
      badge: hero.badge ?? baseContent.hero.badge,
      titleTop: hero.title?.part1 ?? baseContent.hero.titleTop,
      titleAccent: hero.title?.part2 ?? baseContent.hero.titleAccent,
      titleBottom: hero.title?.part3 ?? baseContent.hero.titleBottom,
      subtitle: hero.subtitle ?? baseContent.hero.subtitle,
      ctaPrimary: deepMerge(baseContent.hero.ctaPrimary, hero.buttons?.primary || {}),
      ctaSecondary: deepMerge(baseContent.hero.ctaSecondary, hero.buttons?.secondary || {}),
      stats: heroStats,
    },
    marquee: deepMerge(baseContent.marquee, persisted.marquee || {}),
    about: deepMerge(baseContent.about, persisted.about || {}),
    bestsellers: deepMerge(baseContent.bestsellers, persisted.bestsellers || {}),
    menuTabs: deepMerge(baseContent.menuTabs, persisted.menuTabs || {}),
    experience: deepMerge(baseContent.experience, persisted.experience || {}),
    gallery: deepMerge(baseContent.gallery, persisted.gallery || {}),
    locations: deepMerge(baseContent.locations, persisted.locations || {}),
    testimonials: deepMerge(baseContent.testimonials, persisted.testimonials || {}),
    cta,
    footer: deepMerge(baseContent.footer, persisted.footer || {}),
    floatButton: {
      enabled: isEnabled(persisted.floatButton),
      whatsappUrl: persisted.floatButton?.href || cta.whatsappUrl || baseContent.floatButton.whatsappUrl,
      icon: persisted.floatButton?.icon === 'Chat' ? '💬' : (persisted.floatButton?.icon || baseContent.floatButton.icon),
      ariaLabel: persisted.floatButton?.ariaLabel || baseContent.floatButton.ariaLabel,
    },
  };

  return content;
}
