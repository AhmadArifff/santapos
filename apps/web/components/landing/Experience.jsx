import { experienceContent } from '@/data/landing/experienceContent';
import { resolveAssetUrl } from '@/lib/assetUrl';

export default function Experience({ content = experienceContent }) {
  const data = content || experienceContent;
  const title = data.title || 'Pengalaman Fine Dining';
  const highlight = data.highlight || '';
  const titleParts = highlight ? title.split(highlight) : [title];

  return (
    <section id="experience">
      <div className="reveal">
        <div className="section-label" style={{ justifyContent: 'center' }}>
          {data.sectionLabel}
        </div>
        <h2 className="section-title" style={{ textAlign: 'center' }}>
          {titleParts[0]}
          {highlight ? <span className="italic gold">{highlight}</span> : null}
          {titleParts.slice(1).join(highlight)}
          <br />
          {data.subtitle}
        </h2>
      </div>
      <div className="exp-grid reveal">
        {(data.features || []).map((feature) => (
          <div className="exp-item" key={feature.title}>
            {feature.image ? (
              <div className="exp-image-wrap">
                <img
                  className="exp-image"
                  src={resolveAssetUrl(feature.image, '')}
                  alt={feature.title}
                />
              </div>
            ) : null}
            <div className="exp-title">{feature.title}</div>
            <div className="exp-desc">{feature.description}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
