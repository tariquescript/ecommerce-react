import { Fragment } from 'react';
import { Icon } from '../../components/ui/Icon.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ModelSlot } from '../../components/three/ModelSlot.jsx';
import { aisleFor } from './aisles.js';

const SIGN = ['The', 'everyday,', 'upgraded.'];

/**
 * The hero is a shopfront, drawn in CSS: a fascia sign that switches on, a
 * striped awning, and a lit window with the week's display behind the glass.
 *
 * The display is the navigation — each 3D object in the window is a real
 * button that filters the catalogue to its aisle.
 */
export function Hero({ aisles, counts, total, onPickAisle, onBrowse, onShipping }) {
  return (
    <section className="storefront" aria-labelledby="hero-title">
      <div className="grain" aria-hidden="true" />

      <div className="storefront__inner page">
        <div className="fascia">
          <span className="fascia__plaque" aria-hidden="true">
            Nº 26
          </span>
          <h1 id="hero-title" className="fascia__title">
            {SIGN.map((word, i) => (
              // Real spaces keep the heading's accessible name a sentence.
              <Fragment key={word}>
                <span className="fascia__word" style={{ '--i': i }}>
                  {word}
                </span>{' '}
              </Fragment>
            ))}
          </h1>
          <span className="fascia__plaque" aria-hidden="true">
            Est. 2026
          </span>
        </div>

        <div className="awning" aria-hidden="true" />

        <div className="window">
          <div className="window__sheen" aria-hidden="true" />

          {/* Decorative: the same promise is stated in the sill copy below. */}
          <div className="open-sign" aria-hidden="true">
            <span className="open-sign__card">
              <span className="open-sign__face">Open</span>
              <span className="open-sign__face open-sign__face--back">60-day returns</span>
            </span>
          </div>

          <p className="window__caption">
            <span>In the window this week</span>
            <span className="window__hint">Click an object to shop its aisle</span>
          </p>

          <ul className="display">
            {aisles.map((name, i) => (
              <li key={name} className="display__cell" style={{ '--i': i }}>
                <button
                  type="button"
                  className="display__item"
                  data-model-host
                  onClick={() => onPickAisle(name)}
                  aria-label={`${name}: ${counts[name] ?? 0} pieces. Show this aisle`}
                >
                  <ModelSlot model={aisleFor(name).model} delay={500 + i * 90} className="display__model" />
                  <span className="display__label">{name}</span>
                  <span className="display__count tnum">{String(counts[name] ?? 0).padStart(2, '0')}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="sill">
          <p className="sill__lede">
            {total} well-made things for the kitchen, the wardrobe and everywhere in between —
            shipped in two days, returnable for sixty.
          </p>
          <div className="sill__actions">
            <Button variant="tangerine" size="lg" onClick={onBrowse}>
              Shop the catalogue
              <Icon name="arrowRight" size={18} />
            </Button>
            <Button variant="on-stage" size="lg" onClick={onShipping}>
              How we ship
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
