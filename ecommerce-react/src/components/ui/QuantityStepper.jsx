import { Icon } from './Icon.jsx';

const MIN = 1;
const MAX = 10;

/**
 * Replaces the original <select> of ten <option>s. Fewer DOM nodes per card
 * (42 cards x 10 options was 420 nodes), and it reads as a real product control.
 */
export function QuantityStepper({ value, onChange, size = 'md', label = 'Quantity' }) {
  const step = (delta) => onChange(Math.min(MAX, Math.max(MIN, value + delta)));

  return (
    <div className={`stepper stepper--${size}`} role="group" aria-label={label}>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => step(-1)}
        disabled={value <= MIN}
        aria-label="Decrease quantity"
      >
        <Icon name="minus" size={14} strokeWidth={2} />
      </button>
      <span className="stepper__value tnum" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => step(1)}
        disabled={value >= MAX}
        aria-label="Increase quantity"
      >
        <Icon name="plus" size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
