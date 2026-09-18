import { useEffect, useRef } from 'react';
import { createHeroScene } from './scene.js';
import { useTheme } from '../../app/providers/theme-context.js';

/**
 * Lazily-loaded WebGL canvas.
 *
 * This module is the only thing that pulls three.js into the bundle, and it is
 * imported through React.lazy from an idle callback — so the hero text, the
 * product grid and every interaction are done before a byte of it is fetched.
 */
const PALETTES = {
  dark: { accent: '#e8b44c', ambient: '#8ea2c4', ground: '#0b0c0f' },
  light: { accent: '#c8922c', ambient: '#ffffff', ground: '#d9d4c8' },
};

export default function HeroCanvas() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const stage = canvas.closest('.hero-visual');

    let scene;
    try {
      scene = createHeroScene(canvas, PALETTES[theme] ?? PALETTES.dark);
    } catch {
      // No WebGL, or a context that exists but cannot render — the CSS
      // artwork underneath stays on screen and nothing else changes.
      stage?.classList.add('is-unavailable');
      return undefined;
    }
    sceneRef.current = scene;

    const parent = canvas.parentElement;
    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) scene.resize(width, height);
    });
    resizeObserver.observe(parent);

    // Only run while the canvas is actually on screen and the tab is focused —
    // an animation loop burning battery behind a hidden tab is a real cost.
    let onScreen = false;
    const updateRunning = () => {
      if (onScreen && !document.hidden) scene.start();
      else scene.stop();
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        updateRunning();
      },
      { threshold: 0.01 }
    );
    visibilityObserver.observe(parent);
    document.addEventListener('visibilitychange', updateRunning);

    const onPointerMove = (event) => {
      const rect = parent.getBoundingClientRect();
      scene.setPointer(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      );
    };
    const onPointerLeave = () => scene.setPointer(0, 0);

    // Listen on the section, not the canvas, so the gem tracks the whole hero.
    const surface = parent.closest('.hero') ?? parent;
    surface.addEventListener('pointermove', onPointerMove, { passive: true });
    surface.addEventListener('pointerleave', onPointerLeave, { passive: true });

    // Only now does the CSS stand-in hand over to the live canvas.
    stage?.classList.add('is-live');

    return () => {
      stage?.classList.remove('is-live');
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', updateRunning);
      surface.removeEventListener('pointermove', onPointerMove);
      surface.removeEventListener('pointerleave', onPointerLeave);
      scene.dispose();
      sceneRef.current = null;
    };
    // The scene is built once; theme changes are pushed through setPalette below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setPalette(PALETTES[theme] ?? PALETTES.dark);
  }, [theme]);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
