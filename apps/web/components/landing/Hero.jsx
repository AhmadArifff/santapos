'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { heroContent } from '@/data/landing/heroContent';
import { resolveAssetUrl } from '@/lib/assetUrl';

function animateCounter(el, target, suffix) {
  let current = 0;
  const numericTarget = Number(target || 0);
  const step = numericTarget / 50;
  const timer = window.setInterval(() => {
    current += step;
    if (current >= numericTarget) {
      current = numericTarget;
      window.clearInterval(timer);
    }
    el.textContent = `${Math.floor(current)}${suffix || ''}`;
  }, 30);
}

export default function Hero({ content = heroContent }) {
  const statsRef = useRef(null);
  const data = content || heroContent;
  const stats = data.stats || [];

  useEffect(() => {
    const node = statsRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const nums = entry.target.querySelectorAll('.stat-num');
          if (nums[0]) animateCounter(nums[0], stats[0]?.value, stats[0]?.suffix);
          if (nums[1]) animateCounter(nums[1], stats[1]?.value, stats[1]?.suffix);
          if (nums[2]) nums[2].textContent = stats[2]?.text ?? `${stats[2]?.value ?? ''}${stats[2]?.suffix ?? ''}`;
          observer.disconnect();
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [stats]);

  return (
    <section id="hero">
      <div className="hero-bg" style={{ backgroundImage: `url('${resolveAssetUrl(data.backgroundImage, '')}')` }} />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge">{data.badge}</div>
        <h1 className="hero-title">
          <span className="italic">{data.titleTop}</span>
          <span className="accent">{data.titleAccent}</span>
          {data.titleBottom}
        </h1>
        <p className="hero-sub">{data.subtitle}</p>
        <div className="hero-btns">
          {data.ctaPrimary?.href?.startsWith('/') ? (
            <Link href={data.ctaPrimary.href} className="btn-primary">{data.ctaPrimary?.label}</Link>
          ) : (
            <a href={data.ctaPrimary?.href} className="btn-primary">{data.ctaPrimary?.label}</a>
          )}
          <a href={data.ctaSecondary?.href} className="btn-outline">{data.ctaSecondary?.label}</a>
        </div>
      </div>
      <div className="hero-stats" ref={statsRef}>
        {stats.map((stat, idx) => (
          <div className="stat-item" key={`${stat.label}-${idx}`}>
            <span className="stat-num">{stat.text ?? `${stat.value}${stat.suffix || ''}`}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
      <div className="scroll-indicator" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
        <div className="scroll-line" />
      </div>
    </section>
  );
}
