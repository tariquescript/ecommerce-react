import { describe, expect, it } from 'vitest';
import { barsFor } from './barcode-bars.js';

describe('barsFor', () => {
  it('prints the same bars for the same value', () => {
    expect(barsFor('ORDER-27cba69d')).toEqual(barsFor('ORDER-27cba69d'));
  });

  it('prints different bars for different values', () => {
    expect(barsFor('ORDER-1').bars).not.toEqual(barsFor('ORDER-2').bars);
  });

  it('lays bars out left to right without overlap', () => {
    const { bars, length } = barsFor('TARIQUESCRIPT');
    for (let i = 1; i < bars.length; i += 1) {
      expect(bars[i].x).toBeGreaterThan(bars[i - 1].x + bars[i - 1].width - 1);
    }
    const last = bars.at(-1);
    expect(length).toBeGreaterThanOrEqual(last.x + last.width);
  });
});
