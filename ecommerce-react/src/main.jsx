import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import App from './app/App.jsx';
import { ThemeProvider } from './app/providers/ThemeProvider.jsx';
import { ToastProvider } from './app/providers/ToastProvider.jsx';
import { CartProvider } from './features/cart/CartProvider.jsx';
import { prefetch } from './lib/api/client.js';

// Fired before React mounts, so the catalogue request overlaps hydration
// instead of queueing behind it.
prefetch('/api/products');
prefetch('/api/cart-items?expand=product');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
