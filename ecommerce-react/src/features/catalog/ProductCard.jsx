import { memo, useState } from 'react';
import { ProductImage } from '../../components/ui/ProductImage.jsx';
import { Rating } from '../../components/ui/Rating.jsx';
import { QuantityStepper } from '../../components/ui/QuantityStepper.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { formatMoney } from '../../lib/format.js';
import { useCart } from '../cart/cart-context.js';
import { useReveal } from '../../lib/hooks/index.js';
import { Button } from '../../components/ui/Button.jsx';

/**
 * The grid is `auto-fill minmax(240px, 1fr)`, so column count — and therefore
 * card width — steps unpredictably with the viewport. Rather than chase those
 * steps with breakpoints (which under-fetched a 240w file into a ~296px card
 * in the three-column range), this declares two regimes and rounds up. At 1x
 * desktop that always resolves to the 400w file: ~6 KB, and never soft.
 */
const GRID_SIZES = '(max-width: 760px) 50vw, 320px';

/**
 * memo() matters here: the grid re-renders on every cart mutation, and without
 * it all 42 cards would re-render to update one badge.
 */
export const ProductCard = memo(function ProductCard({ product, index = 0, priority = false }) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem, pending } = useCart();
  const revealRef = useReveal();

  const isBusy = pending.has(product.id);

  async function handleAdd() {
    await addItem(product, quantity);
    setJustAdded(true);
    setQuantity(1);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <article
      ref={revealRef}
      className="product-card reveal"
      style={{ '--reveal-delay': `${Math.min(index, 7) * 45}ms` }}
    >
      <div className="product-card__media">
        <ProductImage src={product.image} alt={product.name} sizes={GRID_SIZES} priority={priority} />
        <span className="product-card__price-tag tnum">{formatMoney(product.priceCents)}</span>
      </div>

      <div className="product-card__body">
        <h3 className="product-card__name clamp-2" title={product.name}>
          {product.name}
        </h3>

        <Rating stars={product.rating.stars} count={product.rating.count} />

        <div className="product-card__actions">
          <QuantityStepper value={quantity} onChange={setQuantity} size="sm" />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isBusy}
            className={`product-card__add ${justAdded ? 'is-added' : ''}`}
          >
            <Icon name={justAdded ? 'check' : 'plus'} size={15} strokeWidth={2.2} />
            {justAdded ? 'Added' : 'Add'}
          </Button>
        </div>
      </div>
    </article>
  );
});
