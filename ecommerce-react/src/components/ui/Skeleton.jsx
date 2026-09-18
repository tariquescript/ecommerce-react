/** Shimmer placeholder. Sized by the caller so it occupies the real layout box. */
export function Skeleton({ width = '100%', height = '1em', radius = 'var(--r-sm)', className = '' }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** Mirrors ProductCard's exact geometry, so nothing moves when data lands. */
export function ProductCardSkeleton() {
  return (
    <article className="product-card product-card--skeleton" aria-hidden="true">
      <Skeleton height="auto" className="product-card__media" radius="var(--r-lg)" />
      <div className="product-card__body">
        <Skeleton height="0.9em" width="85%" />
        <Skeleton height="0.9em" width="55%" />
        <Skeleton height="1.4em" width="40%" radius="var(--r-sm)" />
      </div>
    </article>
  );
}
