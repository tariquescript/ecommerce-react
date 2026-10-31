/**
 * The only door into three.js. Nothing in the critical path imports it —
 * slots ask for the stage here, and the chunk is fetched once the browser is
 * idle after first paint, so the headline and catalogue never wait on WebGL.
 */

let stagePromise = null;

/**
 * Should this device draw 3D at all? Bails on save-data, 2G and low-core
 * hardware; those visitors keep the CSS stand-ins, which are designed to
 * stand on their own. Reduced motion is NOT a bail-out — those visitors get
 * still frames, handled inside the stage.
 */
export function canRender3D() {
  if (typeof window === 'undefined' || typeof WebGLRenderingContext === 'undefined') return false;
  const connection = navigator.connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && /2g$/.test(connection.effectiveType)) return false;
  if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency < 4) {
    return false;
  }
  return true;
}

/** Resolves to the shared stage; rejects (once, for everyone) if WebGL is unusable. */
export function loadStage() {
  if (!stagePromise) {
    stagePromise = new Promise((resolve) => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(resolve, { timeout: 1200 });
      else setTimeout(resolve, 200);
    })
      .then(() => import('./stage.js'))
      .then((module) => module.getStage());
  }
  return stagePromise;
}
