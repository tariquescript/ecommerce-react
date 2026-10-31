import { useMemo } from 'react';
import { barsFor } from './barcode-bars.js';

/** Decorative barcode for slips and receipts — see barcode-bars.js. */
export function Barcode({ value, height = 40, className = '' }) {
  const { bars, length } = useMemo(() => barsFor(value), [value]);

  return (
    <svg
      className={`barcode ${className}`}
      viewBox={`0 0 ${length} ${height}`}
      preserveAspectRatio="none"
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} width={bar.width} height={height} fill="currentColor" />
      ))}
    </svg>
  );
}
