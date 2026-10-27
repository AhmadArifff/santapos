import { aboutContent } from '@/data/landing/aboutContent';
import { resolveAssetUrl } from '@/lib/assetUrl';

export default function About({ content = aboutContent }) {
  const data = content || aboutContent;
  return (
    <section id="about">
      <div className="about-grid">
        <div className="about-img-wrap reveal">
          <img className="about-img-main" src={resolveAssetUrl(data.mainImage, '')} alt="Interior Sultan Kebab" />
          <img className="about-img-accent" src={resolveAssetUrl(data.accentImage, '')} alt="Kebab Premium" />
          <div className="about-badge">
            <span>{data.badgeTop}</span>
            <small>{data.badgeBottom}</small>
          </div>
        </div>
        <div className="reveal reveal-delay-1">
          <div className="section-label">{data.sectionLabel}</div>
          <h2 className="section-title">
            Warisan Rasa <span className="italic gold">{data.highlight}</span> Timur Tengah
          </h2>
          <p className="section-desc">{data.description}</p>
          <div className="about-features">
            {(data.features || []).map((feature) => (
              <div className="about-feat" key={feature.title}>
                <span className="feat-icon">{feature.icon}</span>
                <div>
                  <div className="feat-title">{feature.title}</div>
                  <div className="feat-desc">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
