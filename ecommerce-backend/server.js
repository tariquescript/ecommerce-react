import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './models/index.js';
import productRoutes from './routes/products.js';
import deliveryOptionRoutes from './routes/deliveryOptions.js';
import cartItemRoutes from './routes/cartItems.js';
import orderRoutes from './routes/orders.js';
import resetRoutes from './routes/reset.js';
import paymentSummaryRoutes from './routes/paymentSummary.js';
import { Product } from './models/Product.js';
import { DeliveryOption } from './models/DeliveryOption.js';
import { CartItem } from './models/CartItem.js';
import { Order } from './models/Order.js';
import { defaultProducts } from './defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from './defaultData/defaultDeliveryOptions.js';
import { defaultCart } from './defaultData/defaultCart.js';
import { defaultOrders } from './defaultData/defaultOrders.js';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track if database is initialized
let dbInitialized = false;

// Initialize database
async function initDatabase() {
  if (dbInitialized) return;
  try {
    await sequelize.sync();

    const productCount = await Product.count();
    if (productCount === 0) {
      const timestamp = Date.now();

      const productsWithTimestamps = defaultProducts.map((product, index) => ({
        ...product,
        createdAt: new Date(timestamp + index),
        updatedAt: new Date(timestamp + index)
      }));

      const deliveryOptionsWithTimestamps = defaultDeliveryOptions.map((option, index) => ({
        ...option,
        createdAt: new Date(timestamp + index),
        updatedAt: new Date(timestamp + index)
      }));

      const cartItemsWithTimestamps = defaultCart.map((item, index) => ({
        ...item,
        createdAt: new Date(timestamp + index),
        updatedAt: new Date(timestamp + index)
      }));

      const ordersWithTimestamps = defaultOrders.map((order, index) => ({
        ...order,
        createdAt: new Date(timestamp + index),
        updatedAt: new Date(timestamp + index)
      }));

      await Product.bulkCreate(productsWithTimestamps);
      await DeliveryOption.bulkCreate(deliveryOptionsWithTimestamps);
      await CartItem.bulkCreate(cartItemsWithTimestamps);
      await Order.bulkCreate(ordersWithTimestamps);

      console.log('Default data added to the database.');
    }
    dbInitialized = true;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ecommerce-omega-liart-73.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Initialize database on first request
app.use(async (req, res, next) => {
  await initDatabase();
  next();
});

// Serve images from the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/delivery-options', deliveryOptionRoutes);
app.use('/api/cart-items', cartItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/payment-summary', paymentSummaryRoutes);

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for any unmatched routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

// Error handling middleware
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
/* eslint-enable no-unused-vars */

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
