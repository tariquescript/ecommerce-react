import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deliveryStage } from './stages.js';

const DAY = 86_400_000;
const NOW = new Date('2026-09-18T12:00:00Z').getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe('deliveryStage', () => {
  it('reports "preparing" just after the order is placed', () => {
    const stage = deliveryStage(NOW - 0.2 * DAY, NOW + 6.8 * DAY);

    expect(stage.id).toBe('preparing');
    expect(stage.index).toBe(0);
  });

  it('moves to "shipped" past the halfway point', () => {
    const stage = deliveryStage(NOW - 5 * DAY, NOW + 2 * DAY);

    expect(stage.id).toBe('shipped');
    expect(stage.progress).toBeGreaterThan(0.45);
  });

  it('reports "delivered" once the estimate has passed', () => {
    const stage = deliveryStage(NOW - 10 * DAY, NOW - 3 * DAY);

    expect(stage.id).toBe('delivered');
    expect(stage.progress).toBe(1);
  });

  it('clamps progress to the 0–1 range', () => {
    expect(deliveryStage(NOW + DAY, NOW + 2 * DAY).progress).toBe(0);
    expect(deliveryStage(NOW - 100 * DAY, NOW - 99 * DAY).progress).toBe(1);
  });

  it('treats a zero-length window as already delivered instead of dividing by zero', () => {
    const stage = deliveryStage(NOW, NOW);

    expect(stage.progress).toBe(1);
    expect(stage.id).toBe('delivered');
  });
});
