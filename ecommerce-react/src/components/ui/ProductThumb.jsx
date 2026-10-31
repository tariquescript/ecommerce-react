import { ProductImage } from './ProductImage.jsx';
import { tintFor } from '../../features/catalog/aisles.js';

/**
 * A product photo on its aisle's tint. Used everywhere a product appears
 * outside the grid (bag, checkout, orders, tracking), so an item keeps the
 * same colour from the shelf all the way to the parcel.
 */
export function ProductThumb({ product, sizes, className = '' }) {
  return (
    <span className={`thumb ${className}`} style={{ '--tint': tintFor(product) }}>
      <ProductImage src={product?.image} alt={product?.name ?? ''} sizes={sizes} />
    </span>
  );
}
