import { useRouteError } from 'react-router';
import { Icon } from '../components/ui/Icon.jsx';
import { Button } from '../components/ui/Button.jsx';

/**
 * Keeps one broken page from blanking the whole app — the thing a reviewer
 * notices immediately when a demo throws. Covers render errors and lazy
 * chunks that fail to load (a deploy that replaced them mid-session, say).
 */
export function RouteError() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error('Route error:', error);

  const message =
    error instanceof Error && error.message
      ? error.message
      : 'An unexpected error interrupted this page.';

  return (
    <div className="page empty empty--page">
      <p className="eyebrow">Out of order</p>
      <h1 className="empty__title">Something went wrong</h1>
      <p className="empty__body">{message}</p>
      <Button onClick={() => window.location.reload()}>
        <Icon name="refresh" size={16} />
        Reload
      </Button>
    </div>
  );
}
