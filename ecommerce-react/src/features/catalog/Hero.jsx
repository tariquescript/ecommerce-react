import { Suspense, lazy } from 'react';
import { Icon } from '../../components/ui/Icon.jsx';
import { useIdle, useSupportsHeavyVisuals } from '../../lib/hooks/index.js';
import { Button } from '../../components/ui/Button.jsx';

// three.js lives behind this boundary and nowhere else in the app.
const HeroCanvas = lazy(() => import('../../components/three/HeroCanvas.jsx'));

const STATS = [
  { value: '42', label: 'Curated pieces' },
  { value: '4.6', label: 'Average rating' },
  { value: '2 day', label: 'Priority delivery' },
];

export function Hero({ onBrowse }) {
  const supportsWebGL = useSupportsHeavyVisuals();
  const isIdle = useIdle();
  // Only after first paint, and only on hardware that can spare the frames.
  const showCanvas = supportsWebGL && isIdle;

  return (
    <section className="hero">
      <div className="hero__grid page">
        <div className="hero__copy">
          <p className="hero__eyebrow eyebrow">
            <Icon name="spark" size={13} filled />
            The 2026 collection
          </p>

          <h1 className="hero__title">
            Everyday things,
            <span className="hero__title-accent"> uncommonly made.</span>
          </h1>

          <p className="hero__lede">
            A tightly edited catalogue of home, wear and kit — chosen for how they are
            built, not how loudly they are sold. Free returns on everything.
          </p>

          <div className="hero__actions">
            <Button size="lg" onClick={onBrowse}>
              Browse the collection
              <Icon name="arrowRight" size={17} />
            </Button>
            <Button as="a" variant="ghost" size="lg" href="#assurances">
              How we ship
            </Button>
          </div>

          <dl className="hero__stats">
            {STATS.map((stat) => (
              <div key={stat.label} className="hero__stat">
                <dt className="hero__stat-value tnum">{stat.value}</dt>
                <dd className="hero__stat-label">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hero-visual">
          {/* Always-on CSS artwork. The WebGL layer fades in over it when it
              arrives, and stays the entire visual when it never does. */}
          <div className="hero-visual__fallback" aria-hidden="true">
            <span className="hero-visual__orb" />
            <span className="hero-visual__ring" />
            <span className="hero-visual__ring hero-visual__ring--wide" />
          </div>
          {showCanvas && (
            <Suspense fallback={null}>
              <HeroCanvas />
            </Suspense>
          )}
        </div>
      </div>

      <div className="hero__scrim" aria-hidden="true" />
    </section>
  );
}
