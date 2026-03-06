import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultProducts } from '../defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from '../defaultData/defaultDeliveryOptions.js';
import { defaultCart } from '../defaultData/defaultCart.js';
import { defaultOrders } from '../defaultData/defaultOrders.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post('/', (req, res) => {
  const DATA_DIR = path.join(__dirname, '../backend');
  const FILES = {
    products: path.join(DATA_DIR, 'products.json'),
    cart: path.join(DATA_DIR, 'cart.json'),
    deliveryOptions: path.join(DATA_DIR, 'deliveryOptions.json'),
    orders: path.join(DATA_DIR, 'orders.json')
  };

  // Reset all files to default data
  fs.writeFileSync(FILES.products, JSON.stringify(defaultProducts, null, 2));
  fs.writeFileSync(FILES.deliveryOptions, JSON.stringify(defaultDeliveryOptions, null, 2));
  fs.writeFileSync(FILES.cart, JSON.stringify(defaultCart, null, 2));
  fs.writeFileSync(FILES.orders, JSON.stringify(defaultOrders, null, 2));

  res.status(204).send();
});

export default router;

