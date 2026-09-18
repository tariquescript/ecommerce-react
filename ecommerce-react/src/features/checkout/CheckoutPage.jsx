import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../cart/cart-context.js';
import { useResource } from '../../lib/hooks/index.js';
import { useToast } from '../../app/providers/toast-context.js';
import { ProductImage } from '../../components/ui/ProductImage.jsx';
import { QuantityStepper } from '../../components/ui/QuantityStepper.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatDeliveryDate, formatMoney, formatRelativeDays } from '../../lib/format.js';
import './checkout.css';
import { Button } from '../../components/ui/Button.jsx';

function DeliveryOptions({ options, item, onSelect, disabled }) {
  const name = `delivery-${item.productId}`;

  return (
    <fieldset className="delivery" disabled={disabled}>
      <legend className="delivery__legend eyebrow">Delivery</legend>
      <div className="delivery__list">
        {options.map((option) => {
          const selected = option.id === item.deliveryOptionId;
          return (
            <label key={option.id} className={`delivery__option ${selected ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={selected}
                onChange={() => onSelect(item.productId, option.id)}
                className="delivery__input"
              />
              <span className="delivery__marker" aria-hidden="true" />
              <span className="delivery__detail">
                <span className="delivery__date">{formatDeliveryDate(option.estimatedDeliveryTimeMs)}</span>
                <span className="delivery__price">
                  {option.priceCents === 0 ? 'Free' : `${formatMoney(option.priceCents)} shipping`}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CheckoutPage() {
  const { items, count, updateQuantity, removeItem, setDeliveryOption, placeOrder, pending } =
    useCart();
  const { data: options } = useResource('/api/delivery-options?expand=estimatedDeliveryTime');
  const { data: summary, refresh: refreshSummary } = useResource('/api/payment-summary');
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const deliveryOptions = useMemo(() => options ?? [], [options]);

  // The summary is derived server-side from the cart, so any cart change
  // invalidates it. The client cache is already cleared on mutation; this
  // pulls the fresh numbers down.
  useEffect(() => {
    refreshSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function handlePlaceOrder() {
    setPlacing(true);
    try {
      await placeOrder();
      toast.success('Order placed — thank you.');
      navigate('/orders');
    } catch (error) {
      toast.error(error.message || 'We could not place that order.');
    } finally {
      setPlacing(false);
    }
  }

  if (count === 0) {
    return (
      <div className="page checkout checkout--empty">
        <div className="empty">
          <h1 className="empty__title">Nothing to review yet</h1>
          <p className="empty__body">Add a few pieces and they will appear here.</p>
          <Button as={Link} to="/">
            Browse the collection
            <Icon name="arrowRight" size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page checkout">
      <header className="checkout__head">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="checkout__title">Review your order</h1>
        <p className="checkout__sub">
          {count} {count === 1 ? 'item' : 'items'} · delivery estimates update as you choose
        </p>
      </header>

      <div className="checkout__grid">
        <section className="checkout__items" aria-label="Items in your order">
          {items.map((item) => {
            const selected = deliveryOptions.find((o) => o.id === item.deliveryOptionId);
            const isBusy = pending.has(item.productId);

            return (
              <article key={item.productId} className={`line ${isBusy ? 'is-pending' : ''}`}>
                <div className="line__arrival">
                  <Icon name="truck" size={15} />
                  {selected ? (
                    <span>
                      Arrives {formatDeliveryDate(selected.estimatedDeliveryTimeMs)}
                      <span className="line__relative">
                        {' '}
                        · {formatRelativeDays(selected.estimatedDeliveryTimeMs)}
                      </span>
                    </span>
                  ) : (
                    <Skeleton width="180px" height="0.9em" />
                  )}
                </div>

                <div className="line__grid">
                  <ProductImage
                    src={item.product?.image}
                    alt={item.product?.name ?? ''}
                    sizes="120px"
                    className="line__image"
                  />

                  <div className="line__info">
                    <h2 className="line__name">{item.product?.name}</h2>
                    <p className="line__price tnum">{formatMoney(item.product?.priceCents ?? 0)}</p>

                    <div className="line__controls">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(q) => updateQuantity(item.productId, q)}
                      />
                      <button className="line__remove" onClick={() => removeItem(item.productId)}>
                        <Icon name="trash" size={15} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {deliveryOptions.length > 0 ? (
                    <DeliveryOptions
                      options={deliveryOptions}
                      item={item}
                      onSelect={setDeliveryOption}
                      disabled={isBusy}
                    />
                  ) : (
                    <div className="delivery delivery--loading">
                      <Skeleton height="52px" radius="var(--r-md)" />
                      <Skeleton height="52px" radius="var(--r-md)" />
                      <Skeleton height="52px" radius="var(--r-md)" />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <aside className="summary" aria-label="Payment summary">
          <div className="summary__card">
            <h2 className="summary__title">Payment summary</h2>

            <dl className="summary__rows">
              <div className="summary__row">
                <dt>Items ({summary?.totalItems ?? count})</dt>
                <dd className="tnum">{summary ? formatMoney(summary.productCostCents) : <Skeleton width="60px" />}</dd>
              </div>
              <div className="summary__row">
                <dt>Shipping</dt>
                <dd className="tnum">{summary ? formatMoney(summary.shippingCostCents) : <Skeleton width="50px" />}</dd>
              </div>
              <div className="summary__row summary__row--divider">
                <dt>Before tax</dt>
                <dd className="tnum">{summary ? formatMoney(summary.totalCostBeforeTaxCents) : <Skeleton width="60px" />}</dd>
              </div>
              <div className="summary__row">
                <dt>Estimated tax (10%)</dt>
                <dd className="tnum">{summary ? formatMoney(summary.taxCents) : <Skeleton width="50px" />}</dd>
              </div>
            </dl>

            <div className="summary__total">
              <span>Order total</span>
              <strong className="tnum">
                {summary ? formatMoney(summary.totalCostCents) : <Skeleton width="80px" height="1.4em" />}
              </strong>
            </div>

            <Button
              size="lg"
              full
              loading={placing}
              onClick={handlePlaceOrder}
              disabled={placing || !summary}
            >
              Place your order
              <Icon name="arrowRight" size={17} />
            </Button>

            <p className="summary__secure">
              <Icon name="shield" size={13} />
              This is a portfolio demo — no payment is taken.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
