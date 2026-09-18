import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { Header } from '../components/layout/Header.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { CartDrawer } from '../features/cart/CartDrawer.jsx';
import { CatalogPage } from '../features/catalog/CatalogPage.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { NotFound } from './NotFound.jsx';

/**
 * The landing route ships in the main bundle because it is what every visitor
 * pays for. Everything behind it is split out and fetched on demand.
 */
const CheckoutPage = lazy(() =>
  import('../features/checkout/CheckoutPage.jsx').then((m) => ({ default: m.CheckoutPage }))
);
const OrdersPage = lazy(() =>
  import('../features/orders/OrdersPage.jsx').then((m) => ({ default: m.OrdersPage }))
);
const TrackingPage = lazy(() =>
  import('../features/tracking/TrackingPage.jsx').then((m) => ({ default: m.TrackingPage }))
);

/** Client-side navigation keeps scroll position; a new page should not. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-label="Loading">
      <span className="route-fallback__bar" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header />
      <ScrollToTop />

      <main id="main">
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}
