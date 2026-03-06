import { defaultProducts } from '../defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from '../defaultData/defaultDeliveryOptions.js';
import { defaultCart } from '../defaultData/defaultCart.js';
import { defaultOrders } from '../defaultData/defaultOrders.js';

// In-memory data store (Vercel serverless doesn't support persistent file storage)
let store = {
  products: JSON.parse(JSON.stringify(defaultProducts)),
  cart: JSON.parse(JSON.stringify(defaultCart)),
  deliveryOptions: JSON.parse(JSON.stringify(defaultDeliveryOptions)),
  orders: JSON.parse(JSON.stringify(defaultOrders))
};

// Reset store function (called on hot reload or new deployment)
function resetStore() {
  store = {
    products: JSON.parse(JSON.stringify(defaultProducts)),
    cart: JSON.parse(JSON.stringify(defaultCart)),
    deliveryOptions: JSON.parse(JSON.stringify(defaultDeliveryOptions)),
    orders: JSON.parse(JSON.stringify(defaultOrders))
  };
}

export const DataStore = {
  // Products
  getProducts() {
    return store.products;
  },
  getProductById(id) {
    return store.products.find(p => p.id === id);
  },

  // Cart Items
  getCartItems() {
    return store.cart;
  },
  addToCart(item) {
    const existingItem = store.cart.find(c => c.productId === item.productId);
    if (existingItem) {
      existingItem.quantity += item.quantity || 1;
    } else {
      store.cart.push({ ...item, id: Date.now() });
    }
    return store.cart;
  },
  removeFromCart(productId) {
    store.cart = store.cart.filter(c => c.productId !== productId);
    return store.cart;
  },
  updateCartItem(productId, data) {
    const item = store.cart.find(c => c.productId === productId);
    if (item) {
      Object.assign(item, data);
    }
    return store.cart;
  },
  clearCart() {
    store.cart = [];
    return [];
  },

  // Delivery Options
  getDeliveryOptions() {
    return store.deliveryOptions;
  },
  getDeliveryOptionById(id) {
    return store.deliveryOptions.find(o => o.id === id);
  },

  // Orders
  getOrders() {
    return store.orders;
  },
  createOrder(orderData) {
    const newOrder = {
      ...orderData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    store.orders.push(newOrder);
    return newOrder;
  },
  getOrderById(id) {
    return store.orders.find(o => o.id === id);
  },

  // Reset function for admin/testing
  resetData() {
    resetStore();
    return store;
  }
};

export default DataStore;

