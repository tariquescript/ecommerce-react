import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useResource } from '../../lib/hooks/index.js';
import { ProductThumb } from '../../components/ui/ProductThumb.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ModelSlot } from '../../components/three/ModelSlot.jsx';
import { formatDeliveryDate, formatOrderDate, formatRelativeDays } from '../../lib/format.js';
import { STAGES, deliveryStage } from './stages.js';
import './tracking.css';

/**
 * Resolves a real order line from the URL and derives its progress from the
 * order timestamps. The 3D parcel then drives itself to that point on the
 * route — its position is the progress value, not decoration.
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
        <div className="track">
          <Skeleton width="200px" height="0.9em" />
          <Skeleton width="70%" height="3em" />
          <Skeleton width="100%" height="120px" radius="var(--r-lg)" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="page tracking">
        <div className="empty empty--page" data-model-host>
          <ModelSlot model="parcel" className="empty__model" />
          <h1 className="empty__title">Nothing to track</h1>
          <p className="empty__body">We could not find that parcel.</p>
          <Button as={Link} to="/orders" viewTransition>
            View all orders
          </Button>
        </div>
      </div>
    );
  }

  const { order, line } = match;
  const stage = deliveryStage(order.orderTimeMs, line.estimatedDeliveryTimeMs);
  const delivered = stage.id === 'delivered';
  const percent = Math.round(stage.progress * 100);

  return (
    <div className="page tracking">
      <Link to="/orders" viewTransition className="back-link">
        <Icon name="arrowRight" size={15} className="back-link__icon" />
        All orders
      </Link>

      <div className="track">
        <header className="track__head">
          <p className="eyebrow">
            Order {String(order.id).slice(0, 8)} · placed {formatOrderDate(order.orderTimeMs)}
          </p>
          <h1 className="page-title">
            {delivered ? 'Delivered' : 'Arriving'}{' '}
            <span className="track__date">{formatDeliveryDate(line.estimatedDeliveryTimeMs)}</span>
          </h1>
          {!delivered && (
            <p className="page-sub">That is {formatRelativeDays(line.estimatedDeliveryTimeMs)}.</p>
          )}
        </header>

        <div className="route" data-model-host>
          <div
            className="route__line"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Delivery progress"
          >
            <span className="route__fill" style={{ '--p': stage.progress }} />
          </div>

          <div className="route__parcel" style={{ '--p': stage.progress }}>
            <ModelSlot model="parcel" className="route__model" delay={200} />
          </div>

          <ol className="route__stops">
            {STAGES.map((item, index) => (
              <li
                key={item.id}
                className={`route__stop ${index <= stage.index ? 'is-done' : ''} ${
                  index === stage.index ? 'is-current' : ''
                }`}
              >
                <span className="route__dot" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ol>
        </div>

        <div className="track__product">
          <ProductThumb product={line.product} sizes="120px" className="track__image" />
          <div>
            <h2 className="track__name">{line.product?.name}</h2>
            <p className="track__qty tnum">Quantity: {line.quantity}</p>
          </div>
          <span className={`track__badge track__badge--${stage.id}`}>
            <Icon name={delivered ? 'check' : 'truck'} size={14} strokeWidth={2.2} />
            {stage.label}
          </span>
        </div>
      </div>
    </div>
  );
}
