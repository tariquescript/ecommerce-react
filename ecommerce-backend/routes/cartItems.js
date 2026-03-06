import express from 'express';
import { DataStore } from '../utils/dataStore.js';

const router = express.Router();

router.get('/', (req, res) => {
  const expand = req.query.expand;
  let cartItems = DataStore.getCartItems();

  if (expand === 'product') {
    cartItems = cartItems.map(item => ({
      ...item,
      product: DataStore.getProductById(item.productId)
    }));
  }

  res.json(cartItems);
});

router.post('/', (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = DataStore.getProductById(productId);
  if (!product) {
    return res.status(400).json({ error: 'Product not found' });
  }

  if (typeof quantity !== 'number' || quantity < 1 || quantity > 10) {
    return res.status(400).json({ error: 'Quantity must be a number between 1 and 10' });
  }

  const cartItems = DataStore.addToCart({
    productId,
    quantity,
    deliveryOptionId: "1"
  });

  res.status(201).json(cartItems);
});

router.put('/:productId', (req, res) => {
  const { productId } = req.params;
  const { quantity, deliveryOptionId } = req.body;

  const cartItems = DataStore.getCartItems();
  const cartItem = cartItems.find(c => c.productId === productId);
  
  if (!cartItem) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  if (quantity !== undefined) {
    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be a number greater than 0' });
    }
    cartItem.quantity = quantity;
  }

  if (deliveryOptionId !== undefined) {
    const deliveryOption = DataStore.getDeliveryOptionById(deliveryOptionId);
    if (!deliveryOption) {
      return res.status(400).json({ error: 'Invalid delivery option' });
    }
    cartItem.deliveryOptionId = deliveryOptionId;
  }

  DataStore.updateCartItem(productId, cartItem);
  res.json(cartItem);
});

router.delete('/:productId', (req, res) => {
  const { productId } = req.params;

  const cartItems = DataStore.getCartItems();
  const exists = cartItems.some(c => c.productId === productId);
  
  if (!exists) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  DataStore.removeFromCart(productId);
  res.status(204).send();
});

export default router;

