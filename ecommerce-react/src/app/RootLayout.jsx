import { Outlet, ScrollRestoration, useNavigation } from 'react-router';
import { Header } from '../components/layout/Header.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { CartDrawer } from '../features/cart/CartDrawer.jsx';

/**
 * Scroll positions are saved per history entry. Every document's first entry
 * shares the key "default", though, so opening a new URL in the same tab would
 * inherit the scroll position of whatever page was there before. Keying those
 * entries by path keeps reload-restores working without the leak.
 */
const scrollKey = (location) =>
  location.key === 'default' ? location.pathname + location.search : location.key;

/** Thin progress sweep while a lazy page chunk is on its way. */
function RouteProgress() {
  return (
    <div className="route-progress" role="status" aria-label="Loading page">
      <span className="route-progress__bar" />
    </div>
  );
}

export function RootLayout() {
  const navigation = useNavigation();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header />
      {navigation.state === 'loading' && <RouteProgress />}

      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
      <ScrollRestoration getKey={scrollKey} />
    </>
  );
}
