import { Link } from 'react-router';
import { Icon } from '../components/ui/Icon.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ModelSlot } from '../components/three/ModelSlot.jsx';

export function NotFound() {
  return (
    <div className="page empty empty--page" data-model-host>
      <ModelSlot model="duck" className="empty__model" />
      <p className="eyebrow">Error 404 · Aisle not found</p>
      <h1 className="empty__title">This aisle does not exist</h1>
      <p className="empty__body">
        The link may be old, or the address slightly off. The duck is as lost as you are.
      </p>
      <Button as={Link} to="/" viewTransition>
        Back to the shop
        <Icon name="arrowRight" size={16} />
      </Button>
    </div>
  );
}
