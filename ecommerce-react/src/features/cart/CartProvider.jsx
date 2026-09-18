import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { del, fetchJson, post, put } from '../../lib/api/client.js';
import { useToast } from '../../app/providers/toast-context.js';
import { CartContext } from './cart-context.js';
import { cartReducer, initialCartState, summariseCart } from './cartReducer.js';

const CART_PATH = '/api/cart-items?expand=product';

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [isOpen, setOpen] = useState(false);
  /** product ids with an in-flight mutation, so rows can show a busy state. */
  const [pending, setPending] = useState(() => new Set());
  const toast = useToast();
  const itemsRef = useRef(state.items);
  itemsRef.current = state.items;

  const markPending = useCallback((productId, active) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (active) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const sync = useCallback(async () => {
    const items = await fetchJson(CART_PATH);
    dispatch({ type: 'hydrate', items: Array.isArray(items) ? items : [] });
  }, []);

  useEffect(() => {
    sync().catch((error) => dispatch({ type: 'error', error }));
  }, [sync]);

  /**
   * Applies a change locally first, then confirms it with the server.
   * If the request fails the previous cart is restored and the user is told —
   * they never sit through a round-trip for a click that almost always works.
   */
  const commit = useCallback(
    async (productId, optimistic, request, failureMessage) => {
      const snapshot = itemsRef.current;
      dispatch(optimistic);
      markPending(productId, true);
      try {
        await request();
        await sync();
      } catch (error) {
        dispatch({ type: 'rollback', items: snapshot });
        toast.error(failureMessage);
        if (import.meta.env.DEV) console.error(error);
      } finally {
        markPending(productId, false);
      }
    },
    [markPending, sync, toast]
  );

  const addItem = useCallback(
    (product, quantity = 1) => {
      setOpen(true);
      return commit(
        product.id,
        { type: 'add', product, quantity },
        () => post('/api/cart-items', { productId: product.id, quantity }),
        `Could not add ${product.name} to your bag.`
      );
    },
    [commit]
  );

  const updateQuantity = useCallback(
    (productId, quantity) =>
      commit(
        productId,
        { type: 'patch', productId, patch: { quantity } },
        () => put(`/api/cart-items/${productId}`, { quantity }),
        'Could not update that quantity.'
      ),
    [commit]
  );

  const setDeliveryOption = useCallback(
    (productId, deliveryOptionId) =>
      commit(
        productId,
        { type: 'patch', productId, patch: { deliveryOptionId } },
        () => put(`/api/cart-items/${productId}`, { deliveryOptionId }),
        'Could not change that delivery option.'
      ),
    [commit]
  );

  const removeItem = useCallback(
    (productId) =>
      commit(
        productId,
        { type: 'remove', productId },
        () => del(`/api/cart-items/${productId}`),
        'Could not remove that item.'
      ),
    [commit]
  );

  const placeOrder = useCallback(async () => {
    const order = await post('/api/orders');
    await sync();
    return order;
  }, [sync]);

  const derived = useMemo(() => summariseCart(state.items), [state.items]);

  const value = useMemo(
    () => ({
      ...state,
      ...derived,
      pending,
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      addItem,
      updateQuantity,
      removeItem,
      setDeliveryOption,
      placeOrder,
      refresh: sync,
    }),
    [state, derived, pending, isOpen, addItem, updateQuantity, removeItem, setDeliveryOption, placeOrder, sync]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
