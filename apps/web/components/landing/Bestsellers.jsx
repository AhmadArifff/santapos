'use client';

import { bestsellersContent } from '@/data/landing/bestsellersContent';
import { resolveAssetUrl } from '@/lib/assetUrl';

function orderWA(item) {
  const msg = encodeURIComponent(
    `Halo Sultan Kebab! Saya ingin memesan ${item}. Mohon informasi ketersediaan dan cara pemesanan. Terima kasih!`,
  );
  window.open(`https://wa.me/6281234567890?text=${msg}`, '_blank');
}

export default function Bestsellers({ content = bestsellersContent, previewMode = false }) {
  const data = content || bestsellersContent;

  return (
    <section id="bestseller">
      <div className="bestseller-header reveal">
        <div className="section-label">{data.sectionLabel}</div>
        <h2 className="section-title">
          Menu <span className="italic gold">{data.highlight}</span>
        </h2>
        <p className="section-desc">{data.description}</p>
      </div>
      <div className="best-grid">
        {(data.products || []).map((product, idx) => (
          <div className={`best-card reveal ${idx === 1 ? 'reveal-delay-1' : idx === 2 ? 'reveal-delay-2' : ''}`} key={product.id}>
            <div className="best-img-wrap">
              <img className="best-img" src={resolveAssetUrl(product.image, '')} alt={product.name} />
            </div>
            <span className="best-badge">{product.badge}</span>
            <span className="best-num">{product.number}</span>
            <div className="best-body">
              <div className="best-name">{product.name}</div>
              <div className="best-desc">{product.description}</div>
              <div className="best-footer">
                <span className="best-price">{product.price}</span>
                <span className="best-rating">
                  <span className="stars">★★★★★</span> {product.ratingText}
                </span>
              </div>
            </div>
            <div className="best-overlay">
              <button
                className="best-overlay-btn"
                type="button"
                onClick={() => {
                  if (previewMode) return;
                  orderWA(product.orderName);
                }}
              >
                Pesan Sekarang
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
