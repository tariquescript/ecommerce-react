/**
 * Inline icon set. Replaces the eight PNG icons the original loaded over the
 * network — these cost no requests, stay crisp at any DPR, and inherit
 * `currentColor` so they theme themselves.
 */

const PATHS = {
  search: 'M11 4a7 7 0 1 0 4.2 12.6l3.6 3.6a1 1 0 0 0 1.4-1.4l-3.6-3.6A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  cart: 'M3 4h2.2a1 1 0 0 1 .98.8L6.6 7m0 0 1.7 8.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.55L20.7 7H6.6Z',
  check: 'M4.5 12.5l4.5 4.5L19.5 6.5',
  close: 'M6 6l12 12M18 6L6 18',
  arrowRight: 'M5 12h13m0 0-5.5-5.5M18 12l-5.5 5.5',
  trash: 'M4 7h16M10 4h4M9 7v11m6-11v11M6 7l1 12.2A2 2 0 0 0 9 21h6a2 2 0 0 0 2-1.8L18 7',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m11.4 0 1.4 1.4M4.9 4.9l1.4 1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
  package: 'M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Zm0 0L12 12m0 0 8.5-4.5M12 12v9',
  truck: 'M3 7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9H3V7Zm11 3h3.4a1 1 0 0 1 .85.47L21 14v2h-7v-6Z',
  shield: 'M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6l7-3Z',
  spark: 'M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  chevronDown: 'M6 9.5 12 15l6-5.5',
  refresh: 'M20 11a8 8 0 1 0-.7 4.3M20 5v6h-6',
};

export function Icon({ name, size = 20, strokeWidth = 1.7, filled = false, ...rest }) {
  const d = PATHS[name];
  if (!d) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={d} />
      {name === 'cart' && !filled && <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />}
      {name === 'cart' && !filled && <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />}
      {name === 'sun' && <circle cx="12" cy="12" r="4" />}
      {name === 'truck' && <circle cx="7.5" cy="18" r="2" />}
      {name === 'truck' && <circle cx="17" cy="18" r="2" />}
    </svg>
  );
}
