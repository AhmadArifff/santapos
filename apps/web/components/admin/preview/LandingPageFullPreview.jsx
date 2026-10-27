'use client';

import { useEffect, useMemo, useRef } from 'react';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Marquee from '@/components/landing/Marquee';
import About from '@/components/landing/About';
import Bestsellers from '@/components/landing/Bestsellers';
import MenuTabs from '@/components/landing/MenuTabs';
import Experience from '@/components/landing/Experience';
import Gallery from '@/components/landing/Gallery';
import Locations from '@/components/landing/Locations';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';
import FloatButton from '@/components/landing/FloatButton';

const PREVIEW_SECTIONS = [
  { id: 'header', title: 'Header Section', Component: Header },
  { id: 'hero', title: 'Hero Section', Component: Hero },
  { id: 'marquee', title: 'Marquee Section', Component: Marquee },
  { id: 'about', title: 'About Section', Component: About },
  { id: 'bestsellers', title: 'Bestsellers Section', Component: Bestsellers, previewMode: true },
  { id: 'menuTabs', title: 'Menu Tabs Section', Component: MenuTabs, previewMode: true },
  { id: 'experience', title: 'Experience Section', Component: Experience },
  { id: 'gallery', title: 'Gallery Section', Component: Gallery },
  { id: 'locations', title: 'Locations Section', Component: Locations, previewMode: true },
  { id: 'testimonials', title: 'Testimonials Section', Component: Testimonials },
  { id: 'cta', title: 'CTA Section', Component: CTA, previewMode: true },
  { id: 'footer', title: 'Footer Section', Component: Footer },
  { id: 'floatButton', title: 'Float Button Section', Component: FloatButton, previewMode: true },
];

const sectionIsEnabled = (section) => section?.enabled !== false;

function normalizeContent(settings) {
  const header = settings?.header || {};
  const hero = settings?.hero || {};

  const heroStats = (hero.stats || []).map((stat) => {
    if (typeof stat?.value === 'string' && !stat?.suffix) {
      return {
        ...stat,
        text: stat.value,
      };
    }
    return {
      ...stat,
      text: stat?.text ?? undefined,
    };
  });

  return {
    header: {
      enabled: header.enabled !== false,
      logo: header.logo?.part1 || 'SULTAN',
      logoSpan: header.logo?.part2 || 'KEBAB',
      navLinks: header.navLinks || [],
      ctaButton: header.buttons?.cta || { label: 'Pesan Sekarang', href: '#' },
      adminButton: header.buttons?.admin || { label: 'Login Admin', href: '/login' },
      mobileCta: header.buttons?.cta || { label: 'Pesan Sekarang', href: '#' },
      mobileAdminButton: header.buttons?.admin || { label: 'Login Admin', href: '/login' },
    },
    hero: {
      enabled: hero.enabled !== false,
      backgroundImage: hero.backgroundImage,
      badge: hero.badge,
      titleTop: hero.title?.part1,
      titleAccent: hero.title?.part2,
      titleBottom: hero.title?.part3,
      subtitle: hero.subtitle,
      ctaPrimary: hero.buttons?.primary || { label: '', href: '#' },
      ctaSecondary: hero.buttons?.secondary || { label: '', href: '#' },
      stats: heroStats,
    },
    marquee: settings?.marquee || {},
    about: settings?.about || {},
    bestsellers: settings?.bestsellers || {},
    menuTabs: settings?.menuTabs || {},
    experience: settings?.experience || {},
    gallery: settings?.gallery || {},
    locations: settings?.locations || {},
    testimonials: settings?.testimonials || {},
    cta: settings?.cta || {},
    footer: settings?.footer || {},
    floatButton: {
      enabled: settings?.floatButton?.enabled !== false,
      whatsappUrl: settings?.floatButton?.href || settings?.cta?.whatsappUrl || '#',
      icon: settings?.floatButton?.icon === 'Chat' ? '💬' : (settings?.floatButton?.icon || '💬'),
      ariaLabel: settings?.floatButton?.ariaLabel || 'Pesan via WhatsApp',
    },
  };
}

export default function LandingPageFullPreview({ settings, highlightedSection }) {
  const previewRootRef = useRef(null);
  const content = useMemo(() => normalizeContent(settings), [settings]);

  useEffect(() => {
    const root = previewRootRef.current;
    if (!root) return;

    const revealEls = root.querySelectorAll('.reveal');
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
  }, [settings]);

  useEffect(() => {
    const root = previewRootRef.current;
    if (!root || !highlightedSection) return;

    const target = root.querySelector(`[data-preview-section="${highlightedSection}"]`);
    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [highlightedSection]);

  return (
    <div ref={previewRootRef} className="landing-page landing-admin-preview min-h-screen bg-[var(--dark)]">
      {PREVIEW_SECTIONS.map((section) => {
        const SectionComponent = section.Component;
        const isActive = highlightedSection === section.id;
        const isVisible = sectionIsEnabled(content[section.id]);

        return (
          <div
            key={section.id}
            data-preview-section={section.id}
            className={`landing-preview-hover-block ${isActive ? 'landing-preview-section--active' : ''} ${
              isVisible ? '' : 'opacity-60 grayscale'
            }`}
          >
            <div className="landing-preview-hover-content">
              {isVisible ? (
                <SectionComponent content={content[section.id]} previewMode={section.previewMode} />
              ) : (
                <div className="flex min-h-[180px] items-center justify-center border border-dashed border-slate-700 bg-slate-950/80 p-6 text-center text-sm font-semibold text-slate-300">
                  {section.title} nonaktif dan tidak ditampilkan di landing page.
                </div>
              )}
            </div>
            <div className="landing-preview-hover-overlay" aria-hidden="true">
              <span className="landing-preview-hover-title">{section.title}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
