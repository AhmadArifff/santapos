'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { menuContent } from '@/data/landing/menuContent';
import { resolveAssetUrl } from '@/lib/assetUrl';

function orderWA(item) {
  const msg = encodeURIComponent(
    `Halo Sultan Kebab! Saya ingin memesan ${item}. Mohon informasi ketersediaan dan cara pemesanan. Terima kasih!`,
  );
  window.open(`https://wa.me/6281234567890?text=${msg}`, '_blank');
}

function splitCategoryLabel(label = '') {
  const parts = String(label).trim().split(/\s+/).filter(Boolean);
  const first = parts[0] || '';
  const hasIcon = /[^\w\s]/u.test(first) && first.length <= 4;

  return {
    icon: hasIcon ? first : '✦',
    text: hasIcon ? parts.slice(1).join(' ') : label,
  };
}

export default function MenuTabs({ content = menuContent, previewMode = false }) {
  const data = content || menuContent;
  const categories = data.categories || [];
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [showcaseOffset, setShowcaseOffset] = useState(0);

  useEffect(() => {
    if (!categories.length) return;
    if (!categories.some((category) => category.id === activeCategory)) {
      setActiveCategory(categories[0]?.id || '');
    }
  }, [activeCategory, categories]);

  const currentCategory = useMemo(
    () => categories.find((category) => category.id === activeCategory) || categories[0],
    [categories, activeCategory],
  );
  const showcaseItems = useMemo(() => currentCategory?.items || [], [currentCategory]);
  const frontShowcaseItem = showcaseItems[showcaseOffset % Math.max(showcaseItems.length, 1)];
  const activeLabel = splitCategoryLabel(currentCategory?.label || '');
  const totalItems = currentCategory?.items?.length || 0;

  useEffect(() => {
    setShowcaseOffset(0);
  }, [currentCategory?.id]);

  useEffect(() => {
    if (showcaseItems.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setShowcaseOffset((current) => (current + 1) % showcaseItems.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, [showcaseItems.length]);

  return (
    <section id="menu">
      <div className="reveal" style={{ maxWidth: '1200px', margin: '0 auto 2rem' }}>
        <div className="section-label">{data.sectionLabel}</div>
        <h2 className="section-title">
          Menu <span className="italic gold">{data.highlight}</span>
        </h2>
        <p className="section-desc">{data.description}</p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {currentCategory ? (
          <div className="menu-showcase">
            <div className="menu-showcase-copy">
              <span className="menu-showcase-kicker">Kategori aktif</span>
              <h3>
                <span>{activeLabel.icon}</span>
                {activeLabel.text || currentCategory.label}
              </h3>
              <p>{frontShowcaseItem?.description || data.description}</p>
              <div className="menu-showcase-stats">
                <span>{totalItems} menu pilihan</span>
                <span>Preview 3D bergerak</span>
                <span>Tap menu untuk order</span>
              </div>
            </div>

            <div className="menu-3d-stage" aria-label="Preview menu bergerak">
              <div className="menu-3d-orbit">
                {showcaseItems.map((item, index) => {
                  const position = ((index - showcaseOffset + showcaseItems.length) % showcaseItems.length) + 1;

                  return (
                    <motion.div
                      className={`menu-3d-card menu-3d-card-${Math.min(position, 3)} ${
                        position > 3 ? 'menu-3d-card-queued' : ''
                      }`}
                      key={`${currentCategory.id}-${item.id}`}
                      initial={{ opacity: 0, y: 24, rotateY: -12 }}
                      animate={{ opacity: 1, y: 0, rotateY: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.5 }}
                    >
                      <img src={resolveAssetUrl(item.image, '')} alt={item.name} />
                      <div>
                        <span>{item.name}</span>
                        <strong>{item.price}</strong>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="menu-tabs" role="tablist" aria-label="Kategori menu Sultan Kebab">
          {categories.map((category) => {
            const parsed = splitCategoryLabel(category.label);
            const isActive = currentCategory?.id === category.id;

            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`menu-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="menu-tab-icon">{parsed.icon}</span>
                <span className="menu-tab-text">{parsed.text || category.label}</span>
                <span className="menu-tab-count">{category.items?.length || 0}</span>
              </button>
            );
          })}
        </div>

        {currentCategory && (
          <AnimatePresence mode="wait">
            <motion.div
              className="menu-panel active"
              id={`panel-${currentCategory.id}`}
              key={currentCategory.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            >
              {(currentCategory.items || []).map((item, index) => (
                <motion.article
                  className="menu-item"
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.035, 0.22), duration: 0.34 }}
                  whileHover={previewMode ? undefined : { y: -6, rotateX: 1.5 }}
                  onClick={() => {
                    if (previewMode) return;
                    orderWA(item.orderName);
                  }}
                >
                  <img className="menu-item-img" src={resolveAssetUrl(item.image, '')} alt={item.name} />
                  <div className="menu-item-info">
                    {item.tag ? (
                      <div>
                        <span
                          className={`menu-item-tag ${item.tagClass}`}
                          style={item.tagColor ? { color: item.tagColor, borderColor: item.tagColor } : undefined}
                        >
                          {item.tag}
                        </span>
                      </div>
                    ) : null}
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-desc">{item.description}</div>
                    <div className="menu-item-footer">
                      <div className="menu-item-price">{item.price}</div>
                      <span className="menu-item-action">Pesan</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
