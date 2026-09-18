import { Link } from 'react-router';
import { Logo } from '../ui/Logo.jsx';

const COLUMNS = [
  { title: 'Shop', links: [['Everything', '/'], ['Your orders', '/orders'], ['Track a parcel', '/tracking']] },
  { title: 'Support', links: [['Delivery', '#assurances'], ['Returns', '#assurances'], ['Warranty', '#assurances']] },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner page">
        <div className="footer__brand">
          <Logo />
          <p className="footer__note">
            A storefront built to show how the front end should feel — responsive,
            accessible, and quick on a cold cache.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} className="footer__col" aria-label={column.title}>
            <h4 className="footer__col-title eyebrow">{column.title}</h4>
            <ul className="footer__list">
              {column.links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith('#') ? (
                    <a href={href} className="footer__link">{label}</a>
                  ) : (
                    <Link to={href} className="footer__link">{label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="footer__col">
          <h4 className="footer__col-title eyebrow">Built with</h4>
          <ul className="footer__list footer__list--plain">
            <li>React 19 · Vite</li>
            <li>three.js (WebGL)</li>
            <li>Express API</li>
          </ul>
        </div>
      </div>

      <div className="footer__base page">
        <p>© {new Date().getFullYear()} TariqueScript. Demo storefront.</p>
        <p>Designed &amp; built by Tarique Shaikh.</p>
      </div>
    </footer>
  );
}
