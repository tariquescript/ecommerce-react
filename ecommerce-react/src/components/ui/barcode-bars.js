/**
 * Bar widths derived from a string: the same value always prints the same
 * barcode, so an order's slip and its receipt match. Decorative only —
 * it is not a scannable symbology, and is hidden from assistive tech.
 */
export function barsFor(value) {
  const bars = [];
  let x = 0;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    // Two bars per character; widths 1–3, gaps 1–2, all from the char code.
    for (const shift of [0, 3]) {
      const width = ((code >> shift) % 3) + 1;
      const gap = ((code >> (shift + 1)) % 2) + 1;
      bars.push({ x, width });
      x += width + gap;
    }
  }
  return { bars, length: x };
}
