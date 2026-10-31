import { useEffect, useRef } from 'react';
import { canRender3D, loadStage } from './load-stage.js';

/**
 * A spot on the page where a 3D object lives.
 *
 * Renders a CSS stand-in immediately (a glossy pebble in the object's colour),
 * then — once the stage has loaded — hands the box to the shared renderer,
 * which adds a canvas and flips `.is-live`. If WebGL never arrives, the
 * stand-in simply stays; the layout is identical either way.
 *
 * Size it with CSS. The interactive surface is the nearest `[data-model-host]`.
 */
export function ModelSlot({ model, delay = 0, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !canRender3D()) return undefined;

    let handle = null;
    let cancelled = false;

    loadStage()
      .then((stage) => {
        if (!cancelled) handle = stage.mount(host, model, { delay });
      })
      .catch(() => {
        // No usable WebGL — the stand-in is the design.
      });

    return () => {
      cancelled = true;
      handle?.dispose();
    };
  }, [model, delay]);

  return (
    <span ref={ref} className={`model-slot ${className}`} data-model={model} aria-hidden="true">
      <span className="model-slot__fallback" />
    </span>
  );
}
