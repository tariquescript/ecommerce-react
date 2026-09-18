import { Component } from 'react';
import { Icon } from '../components/ui/Icon.jsx';
import { Button } from '../components/ui/Button.jsx';

/**
 * Keeps one broken route from blanking the whole app — the thing a reviewer
 * notices immediately when a demo throws.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('Render error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="page empty empty--boundary">
        <h1 className="empty__title">Something went wrong</h1>
        <p className="empty__body">
          {this.state.error.message || 'An unexpected error interrupted this page.'}
        </p>
        <Button onClick={() => window.location.reload()}>
          <Icon name="refresh" size={16} />
          Reload
        </Button>
      </div>
    );
  }
}
