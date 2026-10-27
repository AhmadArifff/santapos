'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { testimonialsContent } from '@/data/landing/testimonialsContent';
import { resolveAssetUrl } from '@/lib/assetUrl';

const splitTitle = (title = '', highlight = '') => {
  if (!highlight || !title.includes(highlight)) return { before: title, highlighted: '', after: '' };
  const [before, ...rest] = title.split(highlight);
  return { before, highlighted: highlight, after: rest.join(highlight) };
};

function TestimonialsColumn({
  items,
  duration = 18,
  reverse = false,
  className = '',
  activeCard,
  onToggleCard,
}) {
  const reduceMotion = useReducedMotion();
  if (!items.length) return null;

  return (
    <div className={`testi-column ${className}`}>
      <motion.div
        className="testi-column-track"
        animate={reduceMotion ? undefined : { y: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={reduceMotion ? undefined : {
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
      >
        {[0, 1].map((copyIndex) => (
          <div className="testi-column-set" key={copyIndex}>
            {items.map((item) => (
              <article
                className={`testi-card ${activeCard === item.id ? 'tc-active' : ''}`}
                key={`${item.id}-${copyIndex}`}
                tabIndex={0}
                role="button"
                aria-label={item.ariaLabel}
                onClick={() => onToggleCard(item.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onToggleCard(item.id);
                  }
                }}
              >
                <div className="testi-media">
                  <img className="testi-bg-img" src={resolveAssetUrl(item.image, '')} alt={item.imageAlt} />
                  {item.badge ? <span className="influencer-badge">{item.badge}</span> : null}
                </div>

                <div className="testi-review-body">
                  <span className="testi-stars">★★★★★</span>
                  <p className="testi-text">{item.review}</p>
                </div>

                <div className="testi-author-strip">
                  <img className="testi-avatar" src={resolveAssetUrl(item.authorAvatar, '')} alt={item.authorAvatarAlt} />
                  <div>
                    <div className="testi-name">{item.author}</div>
                    <div className="testi-role">{item.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Testimonials({ content = testimonialsContent }) {
  const [activeCard, setActiveCard] = useState(null);
  const data = content || testimonialsContent;
  const items = data.items || [];
  const columns = [
    items.filter((_, index) => index % 3 === 0),
    items.filter((_, index) => index % 3 === 1),
    items.filter((_, index) => index % 3 === 2),
  ].filter((column) => column.length);
  const titleParts = splitTitle(data.title, data.highlight);
  const toggleCard = (id) => {
    setActiveCard((prev) => (prev === id ? null : id));
  };

  return (
    <section id="testimonials">
      <div className="testi-header reveal">
        <div className="section-label">{data.sectionLabel}</div>
        <h2 className="section-title">
          {titleParts.before}
          {titleParts.highlighted ? <span className="italic gold">{titleParts.highlighted}</span> : null}
          {titleParts.after}
        </h2>
        <p className="section-desc">{data.description}</p>
      </div>

      <div className="testi-marquee reveal">
        {columns.map((columnItems, index) => (
          <TestimonialsColumn
            key={index}
            items={columnItems}
            duration={index === 1 ? 24 : index === 2 ? 20 : 18}
            reverse={index === 1}
            className={`testi-column-${index + 1}`}
            activeCard={activeCard}
            onToggleCard={toggleCard}
          />
        ))}
      </div>

      <div className="testi-mobile-marquee reveal">
        <TestimonialsColumn
          items={items}
          duration={30}
          className="testi-column-mobile"
          activeCard={activeCard}
          onToggleCard={toggleCard}
        />
      </div>
    </section>
  );
}
