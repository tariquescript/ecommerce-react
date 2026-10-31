import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useCart } from './cart-context.js';
import { ProductThumb } from '../../components/ui/ProductThumb.jsx';
import { QuantityStepper } from '../../components/ui/QuantityStepper.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ModelSlot } from '../../components/three/ModelSlot.jsx';
import { formatMoney } from '../../lib/format.js';
import { useEscapeKey, useLockBodyScroll } from '../../lib/hooks/index.js';

const FREE_SHIPPING_CENTS = 4000;

/**
 * Side sheet for the bag. Adding something never bounces the user to a
 * different route — the whole add → review → checkout path stays in place.
 */
export function CartDrawer() {
  const { items, count, subtotalCents, isOpen, closeCart, updateQuantity, removeItem, pending } =
    useCart();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const returnFocusRef = useRef(null);

  useLockBodyScroll(isOpen);
  useEscapeKey(closeCart, isOpen);

  // Focus moves into the sheet on open and back to whatever opened it on close.
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement;
      closeRef.current?.focus();
    } else if (returnFocusRef.current) {
      returnFocusRef.current.focus?.();
      returnFocusRef.current = null;
    }
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
    <div className={`drawer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen} inert={!isOpen}>
      <button className="drawer__scrim" onClick={closeCart} tabIndex={-1} aria-hidden="true" />

      <aside className="drawer__panel" ref={panelRef} role="dialog" aria-modal="true" aria-label="Your bag">
        <header className="drawer__head">
          <h2 className="drawer__title">
            Your bag <span className="drawer__count tnum">{count}</span>
          </h2>
          <button ref={closeRef} className="icon-btn drawer__close" onClick={closeCart} aria-label="Close bag">
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
                  <Icon name="check" size={14} strokeWidth={2.5} /> <strong>Priority shipping is on us.</strong>
                </>
              ) : (
                <>
                  <strong className="tnum">{formatMoney(remaining)}</strong> away from free priority shipping
                </>
              )}
            </p>
          </div>
        )}

        <div className="drawer__body">
          {items.length === 0 ? (
            <div className="drawer__empty">
              <ModelSlot model="bag" className="drawer__empty-model" />
              <h3>Your bag is empty</h3>
              <p>Pieces you add will show up here.</p>
              <Button variant="secondary" onClick={closeCart}>
                Keep browsing
              </Button>
            </div>
          ) : (
            <ul className="drawer__list">
              {items.map((item, index) => (
                <li
                  key={item.productId}
                  className={`drawer__item ${pending.has(item.productId) ? 'is-pending' : ''}`}
                  style={{ '--i': index }}
                >
                  <ProductThumb product={item.product} sizes="76px" className="drawer__item-image" />

                  <div className="drawer__item-info">
                    <p className="drawer__item-name clamp-2">{item.product?.name}</p>
                    <p className="drawer__item-price tnum">
                      {formatMoney(item.product?.priceCents ?? 0)} each
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
            <Button as={Link} to="/checkout" viewTransition size="lg" full onClick={closeCart}>
              Review your order
              <Icon name="arrowRight" size={18} />
            </Button>
          </footer>
        )}
      </aside>
    </div>
  );
}
