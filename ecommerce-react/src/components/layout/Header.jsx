import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Logo } from '../ui/Logo.jsx';
import { Icon } from '../ui/Icon.jsx';
import { useTheme } from '../../app/providers/theme-context.js';
import { useCart } from '../../features/cart/cart-context.js';

const NAV = [
  { to: '/', label: 'Shop', end: true },
  { to: '/orders', label: 'Orders' },
];

/**
 * Sits flat on the cobalt stage at the top of the home page, then, once the
 * page scrolls, condenses into a floating porcelain capsule. One class flip;
 * CSS does the morph.
 */
export function Header() {
  const { theme, toggle } = useTheme();
  const { count, openCart } = useCart();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Passive, and a boolean per scroll tick — React bails out when it is unchanged.
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onStage = pathname === '/' && !scrolled;
  const nextTheme = theme === 'dark' ? 'day' : 'night';

  return (
    <header className={`header ${scrolled ? 'is-floating' : ''} ${onStage ? 'is-on-stage' : ''}`}>
      <div className="header__bar">
        <Link to="/" viewTransition className="header__brand" aria-label="TariqueScript — home">
          <Logo />
        </Link>

        <nav className="header__nav" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              viewTransition
              className={({ isActive }) => `header__link ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>

          <button
            type="button"
            className="bag-btn"
            data-bag-target
            onClick={openCart}
            aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}
          >
            <Icon name="bag" size={18} />
            <span className="bag-btn__label">Bag</span>
            {/* Keyed on the count so the flip animation replays on every change. */}
            <span key={count} className="bag-btn__count tnum">
              {count > 99 ? '99+' : count}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
