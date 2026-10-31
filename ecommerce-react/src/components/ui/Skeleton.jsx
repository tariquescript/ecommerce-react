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
    <article className="tile tile--skeleton" aria-hidden="true">
      <Skeleton height="auto" className="tile__media" radius="var(--r-lg)" />
      <div className="tile__body">
        <Skeleton height="0.95em" width="85%" />
        <Skeleton height="0.95em" width="50%" />
      </div>
    </article>
  );
}
