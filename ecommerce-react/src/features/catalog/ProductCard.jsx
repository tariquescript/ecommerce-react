import { memo, useRef } from 'react';
import { ProductImage } from '../../components/ui/ProductImage.jsx';
import { Rating } from '../../components/ui/Rating.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { formatMoney } from '../../lib/format.js';
import { useReveal } from '../../lib/hooks/index.js';
import { useCartActions } from '../cart/cart-context.js';
import { MAX_QUANTITY } from '../cart/cartReducer.js';
import { flyToBag } from '../cart/flyToBag.js';
import { aisleFor } from './aisles.js';

/**
 * The grid is `auto-fill minmax(250px, 1fr)`, so column count — and therefore
 * card width — steps unpredictably with the viewport. Rather than chase those
 * steps with breakpoints, this declares two regimes and rounds up. At 1x
 * desktop that resolves to the 400w file: ~6 KB, and never soft.
 */
const GRID_SIZES = '(max-width: 760px) 50vw, 320px';

/**
 * A catalogue tile: the photo multiplied onto its aisle's tint, the price on a
 * hang-tag that swings when you reach for it, and a control that mirrors the
 * bag — "Add" until it is in there, then a live stepper.
 *
 * memo() pays off because the card reads only the cart's *actions* (stable)
 * and receives its own quantity as a prop: adding one thing re-renders one card.
 */
export const ProductCard = memo(function ProductCard({
  product,
  number,
  aisle,
  quantity,
  busy,
  index = 0,
  priority = false,
}) {
  const { addItem, updateQuantity, removeItem } = useCartActions();
  const revealRef = useReveal();
  const mediaRef = useRef(null);
  const { tint } = aisleFor(aisle);

  function handleAdd() {
    flyToBag(mediaRef.current, tint);
    addItem(product, 1);
  }

  function step(delta) {
    const next = quantity + delta;
    if (next <= 0) removeItem(product.id);
    else updateQuantity(product.id, Math.min(MAX_QUANTITY, next));
  }

  return (
    <article
      ref={revealRef}
      className="tile reveal"
      data-vt={`tile-${product.id}`}
      style={{ '--tint': tint, '--reveal-delay': `${(index % 4) * 70}ms` }}
    >
      <div className="tile__media" ref={mediaRef}>
        <div className="tile__meta">
          <span className="tile__no tnum">Nº {String(number).padStart(3, '0')}</span>
          <Rating stars={product.rating.stars} count={product.rating.count} compact size={12} />
        </div>

        <ProductImage
          src={product.image}
          alt={product.name}
          sizes={GRID_SIZES}
          priority={priority}
          className="tile__image"
        />

        <span className="hangtag">
          <span className="hangtag__string" aria-hidden="true" />
          <span className="hangtag__tag tnum">
            <span className="visually-hidden">Price: </span>
            {formatMoney(product.priceCents)}
          </span>
        </span>

        <div className="tile__cta">
          {quantity > 0 ? (
            <div className="tile__stepper" role="group" aria-label={`${product.name} in your bag`}>
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={busy}
                aria-label={quantity === 1 ? `Remove ${product.name} from bag` : 'One fewer'}
              >
                <Icon name={quantity === 1 ? 'trash' : 'minus'} size={15} strokeWidth={2} />
              </button>
              <span className="tile__stepper-value tnum">{quantity} in bag</span>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={busy || quantity >= MAX_QUANTITY}
                aria-label="One more"
              >
                <Icon name="plus" size={15} strokeWidth={2.2} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="tile__add"
              onClick={handleAdd}
              aria-label={`Add ${product.name} to bag`}
            >
              <Icon name="plus" size={18} strokeWidth={2.2} />
              <span className="tile__add-label">Add to bag</span>
            </button>
          )}
        </div>
      </div>

      <div className="tile__body">
        <h3 className="tile__name clamp-2" title={product.name}>
          {product.name}
        </h3>
        <p className="tile__aisle">{aisle}</p>
      </div>
    </article>
  );
});
