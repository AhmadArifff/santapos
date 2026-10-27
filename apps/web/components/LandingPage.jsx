'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Marquee from '@/components/landing/Marquee';
import About from '@/components/landing/About';
import Bestsellers from '@/components/landing/Bestsellers';
import DiscountCampaigns from '@/components/landing/DiscountCampaigns';
import MenuTabs from '@/components/landing/MenuTabs';
import Experience from '@/components/landing/Experience';
import Gallery from '@/components/landing/Gallery';
import Locations from '@/components/landing/Locations';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';
import FloatButton from '@/components/landing/FloatButton';
import { getWebsiteSettings } from '@/lib/api';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { getDefaultLandingContent, resolveLandingContentFromSettings } from '@/lib/landingContent';

const LANDING_CONTENT_CACHE_KEY = 'landing-content-cache-v1';
const IMAGE_KEY_PATTERN = /(image|img|logo|avatar|background|photo|gallery|media|thumbnail)/i;
const IMAGE_VALUE_PATTERN = /^(https?:\/\/|\/images\/|data:image\/|blob:)/i;

const readLandingContentCache = () => {
  if (typeof window === 'undefined') return null;

  try {
    const cached = window.localStorage.getItem(LANDING_CONTENT_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const writeLandingContentCache = (content) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(LANDING_CONTENT_CACHE_KEY, JSON.stringify(content));
  } catch {
    // Ignore storage quota/private mode failures.
  }
};

function LandingContentShell() {
  return (
    <div className="landing-page min-h-screen bg-[var(--dark)]">
      <div className="landing-loading-shell" aria-label="Memuat Sultan Kebab">
        <div className="landing-loading-card">
          <p>Sultan Kebab</p>
          <div />
        </div>
      </div>
    </div>
  );
}

const collectLandingAssetUrls = (value, parentKey = '', urls = new Set()) => {
  if (!value) return urls;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      trimmed
      && !trimmed.includes('<iframe')
      && (IMAGE_KEY_PATTERN.test(parentKey) || IMAGE_VALUE_PATTERN.test(trimmed))
    ) {
      urls.add(resolveAssetUrl(trimmed, ''));
    }
    return urls;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectLandingAssetUrls(item, parentKey, urls));
    return urls;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => collectLandingAssetUrls(child, key, urls));
  }

  return urls;
};

const preloadLandingAssets = async (content) => {
  if (typeof window === 'undefined' || !content) return;
  const urls = [...collectLandingAssetUrls(content)].filter(Boolean).slice(0, 120);
  if (!urls.length) return;

  await Promise.all(urls.map((url) => new Promise((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(resolve, 9000);
    const done = () => {
      window.clearTimeout(timer);
      resolve();
    };
    image.onload = done;
    image.onerror = done;
    image.src = url;
  })));
};

const sectionIsEnabled = (section) => section?.enabled !== false;

export default function LandingPage() {
  const [landingContent, setLandingContent] = useState(() => readLandingContentCache());
  const [renderedContent, setRenderedContent] = useState(() => readLandingContentCache());
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(() => Boolean(readLandingContentCache()));
  const [assetsReady, setAssetsReady] = useState(() => Boolean(readLandingContentCache()));

  useEffect(() => {
    let isMounted = true;

    const loadLandingContent = async () => {
      try {
        const response = await getWebsiteSettings();
        const data = response?.data ?? response ?? {};
        if (!isMounted) return;
        const resolvedContent = resolveLandingContentFromSettings(data);
        setLandingContent(resolvedContent);
        writeLandingContentCache(resolvedContent);
      } catch {
        if (isMounted && !landingContent) {
          setLandingContent(getDefaultLandingContent());
        }
      } finally {
        if (isMounted) setHasAttemptedLoad(true);
      }
    };

    loadLandingContent();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!landingContent) return undefined;
    let active = true;

    if (!renderedContent) setAssetsReady(false);
    preloadLandingAssets(landingContent).finally(() => {
      if (!active) return;
      setRenderedContent(landingContent);
      setAssetsReady(true);
    });

    return () => {
      active = false;
    };
  }, [landingContent, renderedContent]);

  useEffect(() => {
    if (!renderedContent || !assetsReady) return undefined;

    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    revealEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [renderedContent, assetsReady]);

  if (!renderedContent || !hasAttemptedLoad || !assetsReady) {
    return <LandingContentShell />;
  }

  return (
    <div className="landing-page min-h-screen bg-[var(--dark)]">
      {sectionIsEnabled(renderedContent.header) && <Header content={renderedContent.header} />}
      {sectionIsEnabled(renderedContent.hero) && <Hero content={renderedContent.hero} />}
      {sectionIsEnabled(renderedContent.marquee) && <Marquee content={renderedContent.marquee} />}
      {sectionIsEnabled(renderedContent.about) && <About content={renderedContent.about} />}
      {sectionIsEnabled(renderedContent.bestsellers) && <Bestsellers content={renderedContent.bestsellers} />}
      <DiscountCampaigns />
      {sectionIsEnabled(renderedContent.menuTabs) && <MenuTabs content={renderedContent.menuTabs} />}
      {sectionIsEnabled(renderedContent.experience) && <Experience content={renderedContent.experience} />}
      {sectionIsEnabled(renderedContent.gallery) && <Gallery content={renderedContent.gallery} />}
      {sectionIsEnabled(renderedContent.locations) && <Locations content={renderedContent.locations} />}
      {sectionIsEnabled(renderedContent.testimonials) && <Testimonials content={renderedContent.testimonials} />}
      {sectionIsEnabled(renderedContent.cta) && <CTA content={renderedContent.cta} />}
      {sectionIsEnabled(renderedContent.footer) && <Footer content={renderedContent.footer} />}
      {sectionIsEnabled(renderedContent.floatButton) && <FloatButton content={renderedContent.floatButton} />}
    </div>
  );
}
