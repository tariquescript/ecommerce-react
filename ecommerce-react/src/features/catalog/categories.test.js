import { describe, expect, it } from 'vitest';
import { ALL, buildCategories, categoryOf } from './categories.js';

const product = (...keywords) => ({ id: keywords.join('-'), keywords });

describe('categoryOf', () => {
  it('rolls specific keywords up to their shelf', () => {
    expect(categoryOf(product('socks', 'sports', 'apparel'))).toBe('Apparel');
    expect(categoryOf(product('espresso makers', 'kitchen'))).toBe('Appliances');
    expect(categoryOf(product('bath towels', 'washroom'))).toBe('Bath');
  });

  it('prefers the more specific shelf when a product carries both', () => {
    // Tagged "kitchen" as well, but an espresso maker is an appliance.
    expect(categoryOf(product('kitchen', 'espresso makers'))).toBe('Appliances');
    expect(categoryOf(product('apparel', 'shoes'))).toBe('Footwear');
  });

  it('falls back to Home for keywords no shelf claims', () => {
    expect(categoryOf(product('gadget'))).toBe('Home');
    expect(categoryOf({ id: 'x' })).toBe('Home');
  });
});

describe('buildCategories', () => {
  it('always leads with the All chip', () => {
    expect(buildCategories([product('apparel')])[0]).toBe(ALL);
  });

  it('only lists shelves that have stock behind them', () => {
    const categories = buildCategories([product('apparel'), product('kitchen')]);

    expect(categories).toEqual([ALL, 'Apparel', 'Kitchen']);
    expect(categories).not.toContain('Sports');
  });

  it('keeps the declared shelf order regardless of product order', () => {
    const categories = buildCategories([product('sports'), product('apparel'), product('kitchen')]);

    expect(categories).toEqual([ALL, 'Apparel', 'Kitchen', 'Sports']);
  });

  it('places Home last when a product matches no shelf', () => {
    expect(buildCategories([product('gadget'), product('apparel')])).toEqual([
      ALL,
      'Apparel',
      'Home',
    ]);
  });

  it('returns just All for an empty catalogue', () => {
    expect(buildCategories([])).toEqual([ALL]);
  });
});
