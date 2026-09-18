import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useCart } from './cart-context.js';
import { ProductImage } from '../../components/ui/ProductImage.jsx';
import { QuantityStepper } from '../../components/ui/QuantityStepper.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { formatMoney } from '../../lib/format.js';
import { useEscapeKey, useLockBodyScroll } from '../../lib/hooks/index.js';
import { Button } from '../../components/ui/Button.jsx';

const FREE_SHIPPING_CENTS = 4000;

/**
 * Side drawer for the bag. Adding something no longer bounces the user to a
 * different route — the whole add → review → checkout path stays in place.
 */
export function CartDrawer() {
  const { items, count, subtotalCents, isOpen, closeCart, updateQuantity, removeItem, pending } =
    useCart();
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useLockBodyScroll(isOpen);
  useEscapeKey(closeCart, isOpen);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // Focus trap — a drawer the keyboard can tab out of behind the scrim is broken.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const remaining = Math.max(0, FREE_SHIPPING_CENTS - subtotalCents);
  const progress = Math.min(100, (subtotalCents / FREE_SHIPPING_CENTS) * 100);

  return (
    <div className={`drawer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <button
        className="drawer__scrim"
        onClick={closeCart}
        tabIndex={-1}
        aria-hidden="true"
      />

      <aside
        className="drawer__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
      >
        <header className="drawer__head">
          <h2 className="drawer__title">
            Your bag <span className="drawer__count tnum">{count}</span>
          </h2>
          <button
            ref={closeRef}
            className="icon-btn"
            onClick={closeCart}
            aria-label="Close bag"
          >
            <Icon name="close" size={17} strokeWidth={2} />
          </button>
        </header>

        {items.length > 0 && (
          <div className="drawer__shipping">
            <div className="drawer__shipping-bar">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="drawer__shipping-text">
              {remaining === 0 ? (
                <>
                  <Icon name="check" size={13} strokeWidth={2.5} /> Priority shipping is on us
                </>
              ) : (
                <>
                  <span className="tnum">{formatMoney(remaining)}</span> away from free priority
                  shipping
                </>
              )}
            </p>
          </div>
        )}

        <div className="drawer__body">
          {items.length === 0 ? (
            <div className="drawer__empty">
              <span className="drawer__empty-icon">
                <Icon name="cart" size={26} />
              </span>
              <h3>Your bag is empty</h3>
              <p>Pieces you add will show up here.</p>
              <Button variant="secondary" onClick={closeCart}>
                Keep browsing
              </Button>
            </div>
          ) : (
            <ul className="drawer__list">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className={`drawer__item ${pending.has(item.productId) ? 'is-pending' : ''}`}
                >
                  <ProductImage
                    src={item.product?.image}
                    alt={item.product?.name ?? ''}
                    sizes="72px"
                    className="drawer__item-image"
                  />

                  <div className="drawer__item-info">
                    <p className="drawer__item-name clamp-2">{item.product?.name}</p>
                    <p className="drawer__item-price tnum">
                      {formatMoney(item.product?.priceCents ?? 0)}
                    </p>
                    <div className="drawer__item-controls">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(q) => updateQuantity(item.productId, q)}
                        size="sm"
                      />
                      <button
                        className="drawer__remove"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.product?.name ?? 'item'}`}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="drawer__item-total tnum">
                    {formatMoney((item.product?.priceCents ?? 0) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="drawer__foot">
            <div className="drawer__subtotal">
              <span>Subtotal</span>
              <strong className="tnum">{formatMoney(subtotalCents)}</strong>
            </div>
            <p className="drawer__fineprint">Delivery and tax are calculated at checkout.</p>
            <Button as={Link} to="/checkout" size="lg" full onClick={closeCart}>
              Review your order
              <Icon name="arrowRight" size={17} />
            </Button>
          </footer>
        )}
      </aside>
    </div>
  );
}
