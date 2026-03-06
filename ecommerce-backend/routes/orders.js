import express from 'express';
import { DataStore } from '../utils/dataStore.js';

const router = express.Router();

router.get('/', (req, res) => {
  const expand = req.query.expand;
  let orders = DataStore.getOrders().sort((a, b) => b.createdAt - a.createdAt);

  if (expand === 'products') {
    orders = orders.map(order => ({
      ...order,
      products: order.products.map(product => ({
        ...product,
        product: DataStore.getProductById(product.productId)
      }))
    }));
  }

  res.json(orders);
});

router.post('/', (req, res) => {
  const cartItems = DataStore.getCartItems();

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  let totalCostCents = 0;
  const products = cartItems.map(item => {
    const product = DataStore.getProductById(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    const deliveryOption = DataStore.getDeliveryOptionById(item.deliveryOptionId);
    if (!deliveryOption) {
      throw new Error(`Invalid delivery option: ${item.deliveryOptionId}`);
    }
    const productCost = product.priceCents * item.quantity;
    const shippingCost = deliveryOption.priceCents;
    totalCostCents += productCost + shippingCost;
    const estimatedDeliveryTimeMs = Date.now() + deliveryOption.deliveryDays * 24 * 60 * 60 * 1000;
    return {
      productId: item.productId,
      quantity: item.quantity,
      estimatedDeliveryTimeMs
    };
  });

  totalCostCents = Math.round(totalCostCents * 1.1);

  const order = DataStore.createOrder({
    orderTimeMs: Date.now(),
    totalCostCents,
    products
  });

  DataStore.clearCart();

  res.status(201).json(order);
});

router.get('/:orderId', (req, res) => {
  const { orderId } = req.params;
  const expand = req.query.expand;

  let order = DataStore.getOrderById(parseInt(orderId));
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (expand === 'products') {
    order = {
      ...order,
      products: order.products.map(product => ({
        ...product,
        product: DataStore.getProductById(product.productId)
      }))
    };
  }

  res.json(order);
});

export default router;

