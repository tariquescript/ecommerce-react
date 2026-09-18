import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useResource } from '../../lib/hooks/index.js';
import { ProductImage } from '../../components/ui/ProductImage.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatDeliveryDate, formatOrderDate, formatRelativeDays } from '../../lib/format.js';
import { STAGES, deliveryStage } from './stages.js';
import './tracking.css';
import { Button } from '../../components/ui/Button.jsx';

/**
 * The original tracking page was hard-coded markup. This one resolves a real
 * order line from the URL and derives its progress from the order timestamps.
 */
export function TrackingPage() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const productId = params.get('productId');

  const { data: orders, isLoading } = useResource('/api/orders?expand=products');

  const match = useMemo(() => {
    if (!orders?.length) return null;
    const order = orderId ? orders.find((o) => String(o.id) === orderId) : orders[0];
    if (!order) return null;
    const line = productId
      ? order.products.find((p) => p.productId === productId)
      : order.products[0];
    return line ? { order, line } : null;
  }, [orders, orderId, productId]);

  if (isLoading && !match) {
    return (
      <div className="page tracking">
        <div className="tracking__card">
          <Skeleton width="180px" height="0.9em" />
          <Skeleton width="60%" height="2em" />
          <Skeleton width="140px" height="140px" radius="var(--r-lg)" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="page tracking">
        <div className="empty">
          <h1 className="empty__title">Nothing to track</h1>
          <p className="empty__body">We could not find that parcel.</p>
          <Button as={Link} to="/orders">
            View all orders
          </Button>
        </div>
      </div>
    );
  }

  const { order, line } = match;
  const stage = deliveryStage(order.orderTimeMs, line.estimatedDeliveryTimeMs);
  const delivered = stage.id === 'delivered';

  return (
    <div className="page tracking">
      <Link to="/orders" className="tracking__back">
        <Icon name="arrowRight" size={15} className="tracking__back-icon" />
        All orders
      </Link>

      <div className="tracking__card">
        <div className="tracking__header">
          <div>
            <p className="eyebrow">
              Order {String(order.id).slice(0, 8)} · placed {formatOrderDate(order.orderTimeMs)}
            </p>
            <h1 className="tracking__headline">
              {delivered ? 'Delivered' : 'Arriving'}{' '}
              <span className="tracking__date">
                {formatDeliveryDate(line.estimatedDeliveryTimeMs)}
              </span>
            </h1>
            {!delivered && (
              <p className="tracking__relative">
                That is {formatRelativeDays(line.estimatedDeliveryTimeMs)}.
              </p>
            )}
          </div>

          <span className={`tracking__badge tracking__badge--${stage.id}`}>
            <Icon name={delivered ? 'check' : 'truck'} size={14} strokeWidth={2.2} />
            {stage.label}
          </span>
        </div>

        <div className="tracking__product">
          <ProductImage
            src={line.product?.image}
            alt={line.product?.name ?? ''}
            sizes="140px"
            className="tracking__image"
          />
          <div>
            <h2 className="tracking__product-name">{line.product?.name}</h2>
            <p className="tracking__qty tnum">Quantity: {line.quantity}</p>
          </div>
        </div>

        <div className="tracking__progress">
          <div
            className="tracking__rail"
            role="progressbar"
            aria-valuenow={Math.round(stage.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Delivery progress"
          >
            <span className="tracking__fill" style={{ width: `${stage.progress * 100}%` }} />
          </div>

          <ol className="tracking__stages">
            {STAGES.map((item, index) => (
              <li
                key={item.id}
                className={`tracking__stage ${index <= stage.index ? 'is-done' : ''} ${
                  index === stage.index ? 'is-current' : ''
                }`}
              >
                <span className="tracking__stage-dot" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
