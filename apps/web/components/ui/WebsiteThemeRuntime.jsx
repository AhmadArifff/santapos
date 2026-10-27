'use client';

import { useEffect } from 'react';
import { useWebsiteSettings, DEFAULT_SETTINGS } from '@/store/settingsStore';
import { resolveAssetUrl } from '@/lib/assetUrl';

const THEME_VARIABLES = [
  ['gold', '--gold', DEFAULT_SETTINGS.gold],
  ['gold_light', '--gold-light', DEFAULT_SETTINGS.gold_light],
  ['dark', '--dark', DEFAULT_SETTINGS.dark],
  ['dark2', '--dark2', DEFAULT_SETTINGS.dark2],
  ['dark3', '--dark3', DEFAULT_SETTINGS.dark3],
  ['cream', '--cream', DEFAULT_SETTINGS.cream],
  ['cream2', '--cream2', DEFAULT_SETTINGS.cream2],
  ['red', '--red', DEFAULT_SETTINGS.red],
  ['text', '--text', DEFAULT_SETTINGS.text],
  ['text_muted', '--text-muted', DEFAULT_SETTINGS.text_muted],
];

const hexToRgb = (hex, fallback = '201, 168, 76') => {
  if (!hex || typeof hex !== 'string') return fallback;
  const sanitized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(sanitized)) return fallback;
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const setThemeColorMeta = (color) => {
  if (!color) return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head?.appendChild(meta);
  }
  meta.setAttribute('content', color);
};

const setNamedMeta = (name, content) => {
  if (!content) return;
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head?.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

const setManifestLink = () => {
  let link = document.head?.querySelector('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'manifest');
    document.head?.appendChild(link);
  }
  link.setAttribute('href', `/api/manifest?v=${Date.now()}`);
};

const setFaviconLinks = (href, appIconHref = href) => {
  if (!href) return;

  const ensureIconLink = (rel, selector = `link[rel="${rel}"]`, targetHref = href, attrs = {}) => {
    let link = document.head?.querySelector(selector);
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head?.appendChild(link);
    }

    link.setAttribute('href', targetHref);
    Object.entries(attrs).forEach(([key, value]) => link.setAttribute(key, value));
    link.setAttribute('data-dynamic-favicon', 'true');
  };

  document.head
    ?.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')
    .forEach((link) => {
      const rel = link.getAttribute('rel') || '';
      const isAppIcon = rel === 'apple-touch-icon';
      link.setAttribute('href', isAppIcon ? appIconHref : href);
      if (isAppIcon) {
        link.setAttribute('sizes', '180x180');
        link.setAttribute('type', 'image/png');
      }
      link.setAttribute('data-dynamic-favicon', 'true');
    });

  ensureIconLink('icon', 'link[rel~="icon"]');
  ensureIconLink('shortcut icon');
  ensureIconLink('apple-touch-icon', 'link[rel="apple-touch-icon"]', appIconHref, {
    sizes: '180x180',
    type: 'image/png',
  });
};

export default function WebsiteThemeRuntime() {
  const { settings, loadSettings } = useWebsiteSettings();

  useEffect(() => {
    loadSettings().catch(() => {});
  }, [loadSettings]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    try {
      const root = document.documentElement;

      THEME_VARIABLES.forEach(([settingKey, cssVar, fallback]) => {
        root.style.setProperty(cssVar, settings?.[settingKey] || fallback);
      });

      const gold = settings?.gold || DEFAULT_SETTINGS.gold;
      root.style.setProperty('--gold-rgb', hexToRgb(gold));
      document.title = settings?.browser_title || settings?.store_name || DEFAULT_SETTINGS.browser_title;
      setNamedMeta('application-name', settings?.store_name || DEFAULT_SETTINGS.store_name);
      setNamedMeta('apple-mobile-web-app-title', settings?.store_name || DEFAULT_SETTINGS.store_name);
      setThemeColorMeta(gold);
      setManifestLink();

      const rawFaviconUrl = settings?.favicon_url || DEFAULT_SETTINGS.favicon_url;
      setFaviconLinks(resolveAssetUrl(rawFaviconUrl, DEFAULT_SETTINGS.favicon_url), `/api/app-icon?v=${Date.now()}`);
    } catch (error) {
      console.error('WebsiteThemeRuntime: failed to apply website settings', error);
    }
  }, [settings]);

  return null;
}
