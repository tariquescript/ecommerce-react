import { describe, expect, it } from 'vitest';
import { MAX_QUANTITY, cartReducer, initialCartState, summariseCart } from './cartReducer.js';

const socks = { id: 'p1', name: 'Socks', priceCents: 1090 };
const ball = { id: 'p2', name: 'Basketball', priceCents: 2095 };

const stateWith = (...items) => ({ ...initialCartState, status: 'ready', items });
const line = (product, quantity) => ({
  productId: product.id,
  quantity,
  deliveryOptionId: '1',
  product,
});

describe('cartReducer', () => {
  it('appends a product that is not in the cart yet', () => {
    const next = cartReducer(initialCartState, { type: 'add', product: socks, quantity: 2 });

    expect(next.items).toHaveLength(1);
    expect(next.items[0]).toMatchObject({ productId: 'p1', quantity: 2, deliveryOptionId: '1' });
    expect(next.status).toBe('ready');
  });

  it('merges into the existing line rather than duplicating it', () => {
    const next = cartReducer(stateWith(line(socks, 2)), {
      type: 'add',
      product: socks,
      quantity: 3,
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(5);
  });

  it('caps the merged quantity at the limit the API enforces', () => {
    const next = cartReducer(stateWith(line(socks, 9)), {
      type: 'add',
      product: socks,
      quantity: 6,
    });

    expect(next.items[0].quantity).toBe(MAX_QUANTITY);
  });

  it('patches only the targeted line', () => {
    const next = cartReducer(stateWith(line(socks, 1), line(ball, 1)), {
      type: 'patch',
      productId: 'p2',
      patch: { deliveryOptionId: '3' },
    });

    expect(next.items[0].deliveryOptionId).toBe('1');
    expect(next.items[1].deliveryOptionId).toBe('3');
  });

  it('removes a line by product id', () => {
    const next = cartReducer(stateWith(line(socks, 1), line(ball, 1)), {
      type: 'remove',
      productId: 'p1',
    });

    expect(next.items.map((i) => i.productId)).toEqual(['p2']);
  });

  it('restores the snapshot when an optimistic update is rolled back', () => {
    const snapshot = [line(socks, 2)];
    const optimistic = cartReducer(stateWith(...snapshot), {
      type: 'add',
      product: ball,
      quantity: 1,
    });
    expect(optimistic.items).toHaveLength(2);

    const rolledBack = cartReducer(optimistic, { type: 'rollback', items: snapshot });
    expect(rolledBack.items).toEqual(snapshot);
  });

  it('never mutates the state it is given', () => {
    const before = stateWith(line(socks, 1));
    const snapshot = structuredClone(before.items);

    cartReducer(before, { type: 'add', product: socks, quantity: 1 });
    cartReducer(before, { type: 'remove', productId: 'p1' });
    cartReducer(before, { type: 'patch', productId: 'p1', patch: { quantity: 9 } });

    expect(before.items).toEqual(snapshot);
  });

  it('ignores unknown actions', () => {
    const before = stateWith(line(socks, 1));
    expect(cartReducer(before, { type: 'nope' })).toBe(before);
  });
});

describe('summariseCart', () => {
  it('totals quantity and price across lines', () => {
    const { count, subtotalCents } = summariseCart([line(socks, 2), line(ball, 1)]);

    expect(count).toBe(3);
    expect(subtotalCents).toBe(1090 * 2 + 2095);
  });

  it('survives a line whose product failed to expand', () => {
    const { count, subtotalCents } = summariseCart([
      { productId: 'p9', quantity: 3, deliveryOptionId: '1' },
    ]);

    expect(count).toBe(3);
    expect(subtotalCents).toBe(0);
  });

  it('returns zeroes for an empty cart', () => {
    expect(summariseCart([])).toEqual({ count: 0, subtotalCents: 0 });
  });
});
