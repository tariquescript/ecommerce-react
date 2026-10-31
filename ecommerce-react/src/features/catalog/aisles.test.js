import { describe, expect, it } from 'vitest';
import { AISLES, aisleFor, tintFor } from './aisles.js';
import { DISPLAY_ORDER } from './categories.js';

describe('aisles', () => {
  it('dresses every shelf the catalogue can produce', () => {
    for (const shelf of DISPLAY_ORDER) {
      expect(AISLES[shelf], shelf).toMatchObject({
        model: expect.any(String),
        tint: expect.stringMatching(/^var\(--tint-/),
      });
    }
  });

  it('gives every shelf its own object and its own tint', () => {
    const models = DISPLAY_ORDER.map((s) => AISLES[s].model);
    const tints = DISPLAY_ORDER.map((s) => AISLES[s].tint);
    expect(new Set(models).size).toBe(models.length);
    expect(new Set(tints).size).toBe(tints.length);
  });

  it('falls back to Home for an unknown shelf', () => {
    expect(aisleFor('Garden')).toBe(AISLES.Home);
  });

  it('tints a product by the shelf it rolls up to', () => {
    expect(tintFor({ keywords: ['toaster', 'kitchen'] })).toBe(AISLES.Appliances.tint);
    expect(tintFor(undefined)).toBe('var(--img-bg)');
  });
});
