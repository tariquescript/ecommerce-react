import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Logo } from '../ui/Logo.jsx';
import { Icon } from '../ui/Icon.jsx';
import { useTheme } from '../../app/providers/theme-context.js';
import { useCart } from '../../features/cart/cart-context.js';

const NAV = [
  { to: '/', label: 'Shop', end: true },
  { to: '/orders', label: 'Orders' },
];

export function Header() {
  const { theme, toggle } = useTheme();
  const { count, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Passive + rAF-free: a boolean flip per scroll tick is cheaper than
    // reading layout, and the class does the visual work in CSS.
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header__inner page">
        <Link to="/" className="header__brand" aria-label="TariqueScript — home">
          <Logo />
        </Link>

        <nav className="header__nav" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>

          <button
            type="button"
            className="icon-btn icon-btn--cart"
            onClick={openCart}
            aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}
          >
            <Icon name="cart" size={19} />
            {count > 0 && <span className="icon-btn__badge tnum">{count > 99 ? '99+' : count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
