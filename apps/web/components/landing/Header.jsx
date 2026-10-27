'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { headerContent } from '@/data/landing/headerContent';

export default function Header({ content = headerContent }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const data = content || headerContent;
  const navLinks = Array.isArray(data.navLinks) ? data.navLinks : [];
  const mobileNavLinks = navLinks.slice(0, 5);
  const navCta = {
    ...(data.ctaButton || headerContent.ctaButton),
    href: '/order',
  };
  const mobileCta = {
    ...(data.mobileCta || headerContent.mobileCta),
    href: '/order',
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobileNav = () => setMobileOpen(false);

  return (
    <>
      <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
        <a href="#" className="nav-logo" aria-label="Sultan Kebab">
          {data.logo}
          <span>{data.logoSpan}</span>
        </a>
        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
          <li>
            <a href={data.adminButton.href} className="nav-login">
              {data.adminButton.label}
            </a>
          </li>
          <li>
            <Link href={navCta.href} className="nav-cta">
              {navCta.label}
            </Link>
          </li>
        </ul>
        <button
          className="hamburger"
          id="hamburgerBtn"
          type="button"
          aria-label="Buka menu"
          onClick={() => setMobileOpen(true)}
        >
          ☰
        </button>
      </nav>

      <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`} id="mobileNav">
        <button className="mobile-nav-close" id="mobileClose" type="button" onClick={closeMobileNav}>
          ✕
        </button>
        {mobileNavLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={closeMobileNav}>
            {link.label}
          </a>
        ))}
        {data.mobileAdminButton && (
          <a href={data.mobileAdminButton.href} onClick={closeMobileNav}>
            {data.mobileAdminButton.label}
          </a>
        )}
        {mobileCta && (
          <Link href={mobileCta.href} style={{ color: 'var(--gold)' }} onClick={closeMobileNav}>
            {mobileCta.label}
          </Link>
        )}
      </div>
    </>
  );
}
