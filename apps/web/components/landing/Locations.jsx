'use client';

import { useMemo, useState } from 'react';
import { locationsContent } from '@/data/landing/locationsContent';
import { resolveAssetUrl } from '@/lib/assetUrl';

const mapPinIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export default function Locations({ content = locationsContent, previewMode = false }) {
  const data = content || locationsContent;
  const branches = data.branches || [];
  const [activeBranchId, setActiveBranchId] = useState(branches[0]?.id || '');

  const activeBranch = useMemo(
    () => branches.find((branch) => branch.id === activeBranchId) || branches[0],
    [branches, activeBranchId],
  );

  return (
    <section id="locations">
      <div className="loc-header reveal">
        <div className="section-label">{data.sectionLabel}</div>
        <h2 className="section-title">
          Temukan <span className="italic gold">{data.highlight}</span>
          <br />
          {data.subtitle}
        </h2>
        <p className="section-desc">{data.description}</p>
      </div>

      <div className="loc-tabs reveal">
        {branches.map((branch) => (
          <button
            key={branch.id}
            type="button"
            className={`loc-tab ${activeBranch?.id === branch.id ? 'active' : ''}`}
            onClick={() => setActiveBranchId(branch.id)}
          >
            {branch.tabLabel}
          </button>
        ))}
      </div>

      {branches.map((branch) => (
        <div key={branch.id} className={`loc-panel ${activeBranch?.id === branch.id ? 'active' : ''}`} id={`loc-${branch.id}`}>
          <div className="loc-gallery reveal">
            {(branch.gallery || []).map((image, index) => (
              <img key={`${branch.id}-${index}`} src={resolveAssetUrl(image, '')} alt={`${branch.name} ${index + 1}`} />
            ))}
          </div>

          <div className="loc-info reveal reveal-delay-1">
            <div className="section-label">{branch.sectionTag}</div>
            <h3>{branch.name}</h3>
            <div className="loc-area">{branch.area}</div>

            {(branch.details || []).map((detail, index) => (
              <div className="loc-detail" key={`${branch.id}-detail-${index}`}>
                <span className="loc-detail-icon">{detail.icon}</span>
                <span className="loc-detail-text">
                  {Array.isArray(detail.lines)
                    ? detail.lines.map((line, lineIndex) => (
                        <span key={`${branch.id}-${index}-${lineIndex}`}>
                          {line}
                          <br />
                        </span>
                      ))
                    : detail.text}
                </span>
              </div>
            ))}

            <iframe
              className="loc-map-embed"
              src={branch.mapEmbed}
              allowFullScreen
              loading="lazy"
              title={`Peta ${branch.name}`}
            />
            <a
              href={branch.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="loc-map-btn"
              onClick={(e) => {
                if (previewMode) e.preventDefault();
              }}
            >
              {mapPinIcon}
              Buka di Google Maps
            </a>
          </div>
        </div>
      ))}
    </section>
  );
}
