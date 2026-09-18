/**
 * Cart state transitions, kept as a pure function so the optimistic-update
 * behaviour can be tested without mounting React or touching the network.
 */

export const DEFAULT_DELIVERY_ID = '1';

/** The API rejects quantities above this, so the optimistic path must agree. */
export const MAX_QUANTITY = 10;

export const initialCartState = { items: [], status: 'loading', error: null };

export function cartReducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { items: action.items, status: 'ready', error: null };

    case 'add': {
      const existing = state.items.find((i) => i.productId === action.product.id);
      const items = existing
        ? state.items.map((i) =>
            i.productId === action.product.id
              ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + action.quantity) }
              : i
          )
        : [
            ...state.items,
            {
              productId: action.product.id,
              quantity: action.quantity,
              deliveryOptionId: DEFAULT_DELIVERY_ID,
              product: action.product,
            },
          ];
      return { ...state, items, status: 'ready' };
    }

    case 'patch':
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, ...action.patch } : i
        ),
      };

    case 'remove':
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };

    // Restores the pre-optimistic snapshot when a request fails.
    case 'rollback':
      return { ...state, items: action.items };

    case 'error':
      return { ...state, status: 'error', error: action.error };

    default:
      return state;
  }
}

/** Totals derived from the cart; used for the badge and the drawer subtotal. */
export function summariseCart(items) {
  let count = 0;
  let subtotalCents = 0;
  for (const item of items) {
    count += item.quantity;
    subtotalCents += (item.product?.priceCents ?? 0) * item.quantity;
  }
  return { count, subtotalCents };
}
