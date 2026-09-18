import { Link } from 'react-router';
import { Icon } from '../components/ui/Icon.jsx';
import { Button } from '../components/ui/Button.jsx';

export function NotFound() {
  return (
    <div className="page empty empty--boundary">
      <p className="eyebrow">Error 404</p>
      <h1 className="empty__title">This page does not exist</h1>
      <p className="empty__body">The link may be old, or the address slightly off.</p>
      <Button as={Link} to="/">
        Back to the shop
        <Icon name="arrowRight" size={16} />
      </Button>
    </div>
  );
}
