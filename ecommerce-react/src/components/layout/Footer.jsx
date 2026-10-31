import { Link } from 'react-router';
import { Barcode } from '../ui/Barcode.jsx';
import { Icon } from '../ui/Icon.jsx';
import { useReveal } from '../../lib/hooks/index.js';

const SHOP = [
  ['The catalogue', '/'],
  ['Your orders', '/orders'],
  ['Shipping & returns', '/#promises'],
];

const BUILT_WITH = [
  ['React 19 + Vite', '1'],
  ['three.js, one WebGL context', '1'],
  ['Express API', '1'],
  ['Kilobytes of 3D assets', '0'],
];

/**
 * The footer is a till receipt. When it scrolls into view it feeds out of the
 * printer slot in short mechanical jerks — a single CSS keyframe sequence,
 * triggered by the shared reveal observer.
 */
export function Footer() {
  const printerRef = useReveal();

  return (
    <footer className="footer">
      <div className="grain" aria-hidden="true" />

      <div className="footer__inner page">
        <div className="footer__statement">
          <p className="footer__eyebrow">Thanks for stopping by</p>
          <h2 className="footer__title">
            Come back for
            <br />
            the everyday.
          </h2>
          <p className="footer__credit">
            Designed &amp; built by Tarique Shaikh — a storefront made to show how a front end
            should feel: quick on a cold cache, kind to keyboards, and a little bit fun.
          </p>
          <div className="footer__links">
            <a className="footer__link" href="https://tariquescript.vercel.app" target="_blank" rel="noreferrer">
              Portfolio <Icon name="arrowUpRight" size={15} />
            </a>
            <a className="footer__link" href="https://github.com/tariquescript" target="_blank" rel="noreferrer">
              GitHub <Icon name="arrowUpRight" size={15} />
            </a>
          </div>
        </div>

        <div className="printer" ref={printerRef}>
          <div className="printer__slot" aria-hidden="true" />
          <div className="printer__feed">
            <div className="receipt">
              <p className="receipt__brand">TariqueScript</p>
              <p className="receipt__sub">Everyday goods · Est. 2026</p>

              <p className="receipt__heading">Shop</p>
              <ul className="receipt__rows">
                {SHOP.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} viewTransition className="receipt__row receipt__row--link">
                      <span>{label}</span>
                      <span className="receipt__dots" aria-hidden="true" />
                      <Icon name="arrowRight" size={13} />
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="receipt__heading">
                Built with <span>Qty</span>
              </p>
              <ul className="receipt__rows">
                {BUILT_WITH.map(([label, qty]) => (
                  <li key={label} className="receipt__row">
                    <span>{label}</span>
                    <span className="receipt__dots" aria-hidden="true" />
                    <span className="tnum">{qty}</span>
                  </li>
                ))}
              </ul>

              <div className="receipt__total">
                <span>Total</span>
                <span className="tnum">$0.00</span>
              </div>
              <p className="receipt__note">It is a portfolio demo — keep your card.</p>

              <Barcode value="TARIQUESCRIPT-2026" height={44} className="receipt__barcode" />
              <p className="receipt__thanks">Thank you · Come again</p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer__base page">
        <p>© {new Date().getFullYear()} TariqueScript. A demo storefront — no payment is ever taken.</p>
        <p>Set in Funnel Display &amp; Funnel Sans.</p>
      </div>
    </footer>
  );
}
