export const STAGES = [
  { id: 'preparing', label: 'Preparing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
];

/**
 * Derives a real progress value from the order's own timestamps rather than
 * hard-coding "Shipped" the way the original page did.
 */
export function deliveryStage(orderTimeMs, estimatedDeliveryTimeMs) {
  const span = estimatedDeliveryTimeMs - orderTimeMs;
  const elapsed = Date.now() - orderTimeMs;
  const progress = span > 0 ? Math.min(1, Math.max(0, elapsed / span)) : 1;

  const index = progress >= 1 ? 2 : progress > 0.45 ? 1 : 0;
  return { ...STAGES[index], index, progress };
}
