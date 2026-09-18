import { describe, expect, it } from 'vitest';
import manifest from './manifest.json';
import { resolveProductImage } from './resolve.js';

const KNOWN = 'images/products/athletic-cotton-socks-6-pairs.jpg';

describe('resolveProductImage', () => {
  it('builds an AVIF-first source list from the generated ladder', () => {
    const image = resolveProductImage(KNOWN);

    expect(image.sources.map((s) => s.type)).toEqual(['image/avif', 'image/webp']);
    expect(image.sources[0].srcSet).toContain('/media/products/athletic-cotton-socks-6-pairs-400.avif 400w');
  });

  it('offers every width the pipeline produced', () => {
    const image = resolveProductImage(KNOWN);
    const widths = manifest['athletic-cotton-socks-6-pairs'].widths;

    for (const width of widths) {
      expect(image.sources[1].srcSet).toContain(`-${width}.webp ${width}w`);
    }
  });

  it('falls back to a JPEG that every browser can decode', () => {
    expect(resolveProductImage(KNOWN).fallback).toMatch(/\.jpg$/);
  });

  it('carries a dominant colour and a blur placeholder for instant paint', () => {
    const image = resolveProductImage(KNOWN);

    expect(image.color).toMatch(/^#[0-9a-f]{6}$/);
    expect(image.lqip.startsWith('data:image/webp;base64,')).toBe(true);
    // The placeholder is inlined for all 42 products, so it has to stay tiny.
    expect(image.lqip.length).toBeLessThan(600);
  });

  it('serves the original asset for a product the pipeline has never seen', () => {
    const image = resolveProductImage('images/products/brand-new-thing.jpg');

    expect(image.sources).toEqual([]);
    expect(image.fallback).toBe('images/products/brand-new-thing.jpg');
    expect(image.lqip).toBeNull();
  });

  it('does not throw when a cart line has no image at all', () => {
    expect(() => resolveProductImage(undefined)).not.toThrow();
  });
});
