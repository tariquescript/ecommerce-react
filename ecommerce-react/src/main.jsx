import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { router } from './app/router.jsx';
import { ThemeProvider } from './app/providers/ThemeProvider.jsx';
import { ToastProvider } from './app/providers/ToastProvider.jsx';
import { CartProvider } from './features/cart/CartProvider.jsx';
import { prefetch, seed } from './lib/api/client.js';
import catalogSnapshot from './lib/api/catalog.snapshot.json';

// The catalogue renders from a build-time snapshot on the very first frame and
// is revalidated against the live API straight away — so a cold-starting
// serverless function never stands between a visitor and the products.
seed('/api/products', catalogSnapshot);

// Fired before React mounts, so the requests overlap hydration instead of
// queueing behind it.
prefetch('/api/products');
prefetch('/api/cart-items?expand=product');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
