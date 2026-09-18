const STAR =
  'M10 1.2l2.6 5.3 5.8.85-4.2 4.1 1 5.8L10 14.5l-5.2 2.75 1-5.8L1.6 7.35l5.8-.85L10 1.2z';

function StarRow({ size, className }) {
  return (
    <svg className={className} viewBox="0 0 100 20" width={size * 5} height={size} aria-hidden="true">
      {[0, 20, 40, 60, 80].map((x) => (
        <path key={x} d={STAR} transform={`translate(${x} 0)`} fill="currentColor" />
      ))}
    </svg>
  );
}

/**
 * Star rating: one muted row with a coloured row clipped over it.
 * Two stacked SVGs instead of a gradient keeps it free of document-level
 * `id`s, which would otherwise collide across the 42 cards in the grid.
 */
export function Rating({ stars, count, size = 14, showCount = true }) {
  const label = `Rated ${stars} out of 5${count != null ? ` from ${count} reviews` : ''}`;

  return (
    <span className="rating" role="img" aria-label={label}>
      <span className="rating__track" style={{ '--fill': `${(stars / 5) * 100}%` }}>
        <StarRow size={size} className="rating__row rating__row--empty" />
        <span className="rating__clip">
          <StarRow size={size} className="rating__row rating__row--filled" />
        </span>
      </span>
      {showCount && count != null && <span className="rating__count tnum">{count}</span>}
    </span>
  );
}
