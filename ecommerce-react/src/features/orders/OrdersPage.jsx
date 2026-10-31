import { useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { useResource } from '../../lib/hooks/index.js';
import { useCartActions } from '../cart/cart-context.js';
import { flyToBag } from '../cart/flyToBag.js';
import { ProductThumb } from '../../components/ui/ProductThumb.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Barcode } from '../../components/ui/Barcode.jsx';
import { ModelSlot } from '../../components/three/ModelSlot.jsx';
import { formatMoney, formatOrderDate, formatDeliveryDate } from '../../lib/format.js';
import { tintFor } from '../catalog/aisles.js';
import { STAGES, deliveryStage } from '../tracking/stages.js';
import './orders.css';

function SlipSkeleton() {
  return (
    <article className="slip" aria-hidden="true">
      <div className="slip__head">
        <Skeleton width="160px" height="1em" />
        <Skeleton width="110px" height="1em" />
      </div>
      <div className="slip__line">
        <Skeleton width="88px" height="88px" radius="var(--r-md)" />
        <div className="slip__details">
          <Skeleton width="60%" height="1em" />
          <Skeleton width="35%" height="0.85em" />
        </div>
      </div>
    </article>
  );
}

function SlipLine({ order, line }) {
  const { addItem } = useCartActions();
  const thumbRef = useRef(null);
  const stage = deliveryStage(order.orderTimeMs, line.estimatedDeliveryTimeMs);

  function buyAgain() {
    flyToBag(thumbRef.current, tintFor(line.product));
    addItem(line.product, line.quantity);
  }

  return (
    <div className="slip__line">
      <span ref={thumbRef}>
        <ProductThumb product={line.product} sizes="88px" className="slip__image" />
      </span>

      <div className="slip__details">
        <h2 className="slip__name">{line.product?.name}</h2>
        <p className={`slip__status slip__status--${stage.id}`}>
          <span className="slip__dot" aria-hidden="true" />
          {stage.id === 'delivered'
            ? `Delivered ${formatDeliveryDate(line.estimatedDeliveryTimeMs)}`
            : `${stage.label} · arriving ${formatDeliveryDate(line.estimatedDeliveryTimeMs)}`}
        </p>
        <p className="slip__qty tnum">Qty {line.quantity}</p>
      </div>

      <div className="slip__actions">
        {line.product && (
          <Button variant="secondary" size="sm" onClick={buyAgain}>
            <Icon name="refresh" size={15} />
            Buy again
          </Button>
        )}
        <Button
          as={Link}
          to={`/tracking?orderId=${order.id}&productId=${line.productId}`}
          viewTransition
          variant="ghost"
          size="sm"
        >
          <Icon name="package" size={15} />
          Track
        </Button>
      </div>
    </div>
  );
}

/** An order is only as far along as its slowest parcel. */
function orderStage(order) {
  const index = Math.min(
    ...order.products.map((line) => deliveryStage(order.orderTimeMs, line.estimatedDeliveryTimeMs).index)
  );
  return STAGES[Number.isFinite(index) ? index : 0];
}

export function OrdersPage() {
  const { data, isLoading } = useResource('/api/orders?expand=products');

  // The API sorts on a field the seeded orders don't carry, so order them here.
  const orders = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.orderTimeMs - a.orderTimeMs),
    [data]
  );

  if (!isLoading && orders.length === 0) {
    return (
      <div className="page orders">
        <div className="empty empty--page" data-model-host>
          <ModelSlot model="parcel" className="empty__model" />
          <h1 className="empty__title">No orders yet</h1>
          <p className="empty__body">When you place an order, its packing slip will show up here.</p>
          <Button as={Link} to="/" viewTransition>
            Start shopping
            <Icon name="arrowRight" size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page orders">
      <header className="page-head" data-model-host>
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="page-title">Order history</h1>
          <p className="page-sub">
            {orders.length ? `${orders.length} packing slips, newest first.` : 'Fetching your packing slips…'}
          </p>
        </div>
        <ModelSlot model="parcel" className="page-model" />
      </header>

      <div className="orders__list">
        {isLoading && orders.length === 0
          ? Array.from({ length: 2 }, (_, i) => <SlipSkeleton key={i} />)
          : orders.map((order, index) => {
              const stage = orderStage(order);
              return (
                <article key={order.id} className="slip" style={{ '--i': index }}>
                  <header className="slip__head">
                    <dl className="slip__meta">
                      <div>
                        <dt className="slip__label">Placed</dt>
                        <dd className="slip__value">{formatOrderDate(order.orderTimeMs)}</dd>
                      </div>
                      <div>
                        <dt className="slip__label">Total</dt>
                        <dd className="slip__value tnum">{formatMoney(order.totalCostCents)}</dd>
                      </div>
                      <div>
                        <dt className="slip__label">Lines</dt>
                        <dd className="slip__value tnum">{order.products.length}</dd>
                      </div>
                    </dl>

                    <div className="slip__id">
                      <span className="slip__label">Order Nº</span>
                      <span className="slip__value slip__value--id">{String(order.id).slice(0, 8)}</span>
                      <Barcode value={String(order.id)} height={24} className="slip__barcode" />
                    </div>

                    <span className={`stamp stamp--${stage.id}`} aria-hidden="true">
                      {stage.id === 'shipped' ? 'In transit' : stage.label}
                    </span>
                  </header>

                  <div className="slip__lines">
                    {order.products.map((line) => (
                      <SlipLine key={line.productId} order={order} line={line} />
                    ))}
                  </div>
                </article>
              );
            })}
      </div>
    </div>
  );
}
