import { createContext, useContext } from 'react';

/**
 * The cart is published as two contexts on purpose.
 *
 * State (items, totals, pending, open) changes on every mutation. Actions
 * (addItem, removeItem…) are stable callbacks that never change. A component
 * that only *does* things — like the 42 product cards — reads actions alone,
 * so a cart update no longer re-renders the whole grid; each card gets its own
 * quantity as a prop and memo() can actually skip the rest.
 */
export const CartStateContext = createContext(null);
export const CartActionsContext = createContext(null);

export function useCartActions() {
  const actions = useContext(CartActionsContext);
  if (!actions) throw new Error('useCartActions must be used inside <CartProvider>');
  return actions;
}

/** Cart state alone — for views that render from it but never mutate it. */
export function useCartState() {
  const state = useContext(CartStateContext);
  if (!state) throw new Error('useCartState must be used inside <CartProvider>');
  return state;
}

/** State and actions together, for components that render cart contents. */
export function useCart() {
  const state = useContext(CartStateContext);
  const actions = useContext(CartActionsContext);
  if (!state || !actions) throw new Error('useCart must be used inside <CartProvider>');
  return { ...state, ...actions };
}
