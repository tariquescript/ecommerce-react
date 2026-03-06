import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultProducts } from '../defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from '../defaultData/defaultDeliveryOptions.js';
import { defaultCart } from '../defaultData/defaultCart.js';
import { defaultOrders } from '../defaultData/defaultOrders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../backend');
const FILES = {
  products: path.join(DATA_DIR, 'products.json'),
  cart: path.join(DATA_DIR, 'cart.json'),
  deliveryOptions: path.join(DATA_DIR, 'deliveryOptions.json'),
  orders: path.join(DATA_DIR, 'orders.json')
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
function initializeDataFiles() {
  if (!fs.existsSync(FILES.products)) {
    fs.writeFileSync(FILES.products, JSON.stringify(defaultProducts, null, 2));
  }
  if (!fs.existsSync(FILES.deliveryOptions)) {
    fs.writeFileSync(FILES.deliveryOptions, JSON.stringify(defaultDeliveryOptions, null, 2));
  }
  if (!fs.existsSync(FILES.cart)) {
    fs.writeFileSync(FILES.cart, JSON.stringify(defaultCart, null, 2));
  }
  if (!fs.existsSync(FILES.orders)) {
    fs.writeFileSync(FILES.orders, JSON.stringify(defaultOrders, null, 2));
  }
}

// Read data from file
function readData(filename) {
  try {
    if (!fs.existsSync(FILES[filename])) {
      initializeDataFiles();
    }
    const data = fs.readFileSync(FILES[filename], 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

// Write data to file
function writeData(filename, data) {
  try {
    fs.writeFileSync(FILES[filename], JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
  }
}

// Data store API
export const DataStore = {
  // Products
  getProducts() {
    return readData('products');
  },
  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id);
  },

  // Cart Items
  getCartItems() {
    return readData('cart');
  },
  addToCart(item) {
    const cart = this.getCartItems();
    const existingItem = cart.find(c => c.productId === item.productId);
    if (existingItem) {
      existingItem.quantity += item.quantity || 1;
    } else {
      cart.push({ ...item, id: Date.now() });
    }
    writeData('cart', cart);
    return cart;
  },
  removeFromCart(productId) {
    let cart = this.getCartItems();
    cart = cart.filter(c => c.productId !== productId);
    writeData('cart', cart);
    return cart;
  },
  updateCartItem(productId, data) {
    const cart = this.getCartItems();
    const item = cart.find(c => c.productId === productId);
    if (item) {
      Object.assign(item, data);
    }
    writeData('cart', cart);
    return cart;
  },
  clearCart() {
    writeData('cart', []);
    return [];
  },

  // Delivery Options
  getDeliveryOptions() {
    return readData('deliveryOptions');
  },
  getDeliveryOptionById(id) {
    const options = this.getDeliveryOptions();
    return options.find(o => o.id === id);
  },

  // Orders
  getOrders() {
    return readData('orders');
  },
  createOrder(orderData) {
    const orders = this.getOrders();
    const newOrder = {
      ...orderData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    writeData('orders', orders);
    return newOrder;
  },
  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => o.id === id);
  }
};

// Initialize on import
initializeDataFiles();

export default DataStore;
