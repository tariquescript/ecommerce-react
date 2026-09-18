import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatCount, formatMoney, formatRelativeDays } from './format.js';

describe('formatMoney', () => {
  it('renders cents as dollars with two decimal places', () => {
    expect(formatMoney(1090)).toBe('$10.90');
    expect(formatMoney(799)).toBe('$7.99');
  });

  it('keeps trailing zeroes', () => {
    expect(formatMoney(2000)).toBe('$20.00');
    expect(formatMoney(0)).toBe('$0.00');
  });
});

describe('formatRelativeDays', () => {
  const NOW = new Date('2026-09-18T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('names the next day rather than counting it', () => {
    expect(formatRelativeDays(NOW + 86_400_000)).toBe('tomorrow');
  });

  it('counts days out for later dates', () => {
    expect(formatRelativeDays(NOW + 3 * 86_400_000)).toBe('in 3 days');
  });

  it('collapses anything already due to today', () => {
    expect(formatRelativeDays(NOW)).toBe('today');
    expect(formatRelativeDays(NOW - 5 * 86_400_000)).toBe('today');
  });
});

describe('formatCount', () => {
  it('abbreviates thousands and drops a redundant decimal', () => {
    expect(formatCount(2197)).toBe('2.2k');
    expect(formatCount(2000)).toBe('2k');
  });

  it('leaves small numbers alone', () => {
    expect(formatCount(87)).toBe('87');
  });
});
