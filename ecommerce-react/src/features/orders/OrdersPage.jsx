import { useMemo } from 'react';
import { Link } from 'react-router';
import { useResource } from '../../lib/hooks/index.js';
import { useCart } from '../cart/cart-context.js';
import { ProductImage } from '../../components/ui/ProductImage.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatMoney, formatOrderDate, formatDeliveryDate } from '../../lib/format.js';
import { deliveryStage } from '../tracking/stages.js';
import './orders.css';
import { Button } from '../../components/ui/Button.jsx';

function OrderSkeleton() {
  return (
    <article className="order" aria-hidden="true">
      <div className="order__head">
        <Skeleton width="140px" height="1em" />
        <Skeleton width="100px" height="1em" />
      </div>
      <div className="order__body">
        <Skeleton width="88px" height="88px" radius="var(--r-md)" />
        <div className="order__lines">
          <Skeleton width="60%" height="1em" />
          <Skeleton width="35%" height="0.85em" />
        </div>
      </div>
    </article>
  );
}

export function OrdersPage() {
  const { data, isLoading } = useResource('/api/orders?expand=products');
  const { addItem } = useCart();

  // The API sorts on a field the seeded orders don't carry, so order them here.
  const orders = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.orderTimeMs - a.orderTimeMs),
    [data]
  );

  if (!isLoading && orders.length === 0) {
    return (
      <div className="page orders">
        <div className="empty">
          <h1 className="empty__title">No orders yet</h1>
          <p className="empty__body">When you place an order it will show up here.</p>
          <Button as={Link} to="/">
            Start shopping
            <Icon name="arrowRight" size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page orders">
      <header className="orders__head">
        <p className="eyebrow">Your account</p>
        <h1 className="orders__title">Order history</h1>
      </header>

      <div className="orders__list">
        {isLoading && orders.length === 0
          ? Array.from({ length: 2 }, (_, i) => <OrderSkeleton key={i} />)
          : orders.map((order) => (
              <article key={order.id} className="order">
                <header className="order__head">
                  <div className="order__meta">
                    <div>
                      <span className="order__label eyebrow">Placed</span>
                      <span className="order__value">{formatOrderDate(order.orderTimeMs)}</span>
                    </div>
                    <div>
                      <span className="order__label eyebrow">Total</span>
                      <span className="order__value tnum">{formatMoney(order.totalCostCents)}</span>
                    </div>
                  </div>
                  <div className="order__id">
                    <span className="order__label eyebrow">Order</span>
                    <span className="order__value order__value--id">{String(order.id).slice(0, 8)}</span>
                  </div>
                </header>

                <div className="order__products">
                  {order.products.map((line) => {
                    const stage = deliveryStage(order.orderTimeMs, line.estimatedDeliveryTimeMs);

                    return (
                      <div key={line.productId} className="order__product">
                        <ProductImage
                          src={line.product?.image}
                          alt={line.product?.name ?? ''}
                          sizes="88px"
                          className="order__image"
                        />

                        <div className="order__details">
                          <h2 className="order__product-name">{line.product?.name}</h2>
                          <p className={`order__status order__status--${stage.id}`}>
                            <span className="order__status-dot" aria-hidden="true" />
                            {stage.id === 'delivered'
                              ? `Delivered ${formatDeliveryDate(line.estimatedDeliveryTimeMs)}`
                              : `${stage.label} · arriving ${formatDeliveryDate(line.estimatedDeliveryTimeMs)}`}
                          </p>
                          <p className="order__qty tnum">Quantity: {line.quantity}</p>
                        </div>

                        <div className="order__actions">
                          {line.product && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => addItem(line.product, line.quantity)}
                            >
                              <Icon name="refresh" size={15} />
                              Buy again
                            </Button>
                          )}
                          <Button
                            as={Link}
                            to={`/tracking?orderId=${order.id}&productId=${line.productId}`}
                            variant="ghost"
                            size="sm"
                          >
                            <Icon name="package" size={15} />
                            Track
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
      </div>
    </div>
  );
}
