import { createBrowserRouter } from 'react-router';
import { RootLayout } from './RootLayout.jsx';
import { RouteError } from './RouteError.jsx';
import { NotFound } from './NotFound.jsx';
import { CatalogPage } from '../features/catalog/CatalogPage.jsx';

/**
 * A data router rather than <BrowserRouter>: it is what unlocks View
 * Transitions on navigation, built-in scroll restoration, and lazy routes that
 * resolve *before* the page swaps — so there is never a blank Suspense frame
 * between pages, just the old page cross-fading into the new one.
 *
 * The landing route ships in the main bundle because every visitor pays for
 * it. Everything behind it is split out and fetched on demand.
 */
const lazyPage = (load, name) => () => load().then((module) => ({ Component: module[name] }));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        // Pathless boundary: a failing page (or a chunk that will not load)
        // renders its error inside the layout, so the header and bag survive.
        errorElement: <RouteError />,
        children: [
          { index: true, element: <CatalogPage /> },
          {
            path: 'checkout',
            lazy: lazyPage(() => import('../features/checkout/CheckoutPage.jsx'), 'CheckoutPage'),
          },
          {
            path: 'orders',
            lazy: lazyPage(() => import('../features/orders/OrdersPage.jsx'), 'OrdersPage'),
          },
          {
            path: 'tracking',
            lazy: lazyPage(() => import('../features/tracking/TrackingPage.jsx'), 'TrackingPage'),
          },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);
