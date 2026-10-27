import { footerContent } from '@/data/landing/footerContent';

export default function Footer({ content = footerContent }) {
  const data = content || footerContent;
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <span className="footer-logo">{data.brand}</span>
          <p className="footer-brand-desc">{data.brandDescription}</p>
          <div className="social-links">
            {(data.socialLinks || []).map((social) => (
              <a key={social.label} className="social-link" href={social.href} aria-label={social.label}>
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {(data.columns || []).map((column) => (
          <div className="footer-col" key={column.title}>
            <h4>{column.title}</h4>
            <ul>
              {(column.links || []).map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <p>{data.copyright}</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>{data.note}</p>
      </div>
    </footer>
  );
}
