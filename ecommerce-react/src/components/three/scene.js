/**
 * The hero's WebGL scene, written against three.js directly.
 *
 * Everything is generated in code — no model, texture or HDRI is ever fetched,
 * so the whole visual costs one lazy chunk and nothing on the network.
 *
 * Budget discipline, because this must never cost the page its speed:
 *   • device pixel ratio capped at 1.75
 *   • the loop stops entirely when the canvas scrolls away or the tab hides
 *   • a 64x32 procedural gradient stands in for an environment map
 *   • every geometry, material, texture and context is disposed on teardown
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  DirectionalLight,
  FloatType,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  RGBAFormat,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
} from 'three';

/**
 * Cheap support check. Deliberately does NOT spin up a throwaway context to
 * test with: browsers cap how many WebGL contexts may live at once, and a
 * probe context competing with the real one is itself a way to fail.
 * Anything the check cannot know is handled by the try/catch around
 * createHeroScene plus the context assertion below.
 */
export function isWebGLAvailable() {
  return typeof WebGLRenderingContext !== 'undefined';
}

/** Vertical gradient standing in for an HDRI, so the metal has something to reflect. */
function createEnvironmentTexture(topColor, bottomColor) {
  const width = 64;
  const height = 32;
  const data = new Float32Array(width * height * 4);
  const top = new Color(topColor);
  const bottom = new Color(bottomColor);
  const mixed = new Color();

  for (let y = 0; y < height; y += 1) {
    // Bias the gradient so the bright band sits just above the horizon.
    const t = Math.pow(1 - y / (height - 1), 1.6);
    mixed.copy(bottom).lerp(top, t);
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      data[i] = mixed.r;
      data[i + 1] = mixed.g;
      data[i + 2] = mixed.b;
      data[i + 3] = 1;
    }
  }

  const texture = new DataTexture(data, width, height, RGBAFormat, FloatType);
  texture.needsUpdate = true;
  return texture;
}

function createSparks(count, radius) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    // Even distribution over a spherical shell, slightly flattened.
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.85 + Math.random() * 0.4);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.6;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  return geometry;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ accent: string, ambient: string, ground: string }} palette
 * @returns {{ setPalette: Function, setPointer: Function, resize: Function, start: Function, stop: Function, dispose: Function }}
 */
export function createHeroScene(canvas, palette) {
  if (!isWebGLAvailable()) throw new Error('WebGL unavailable');

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: window.devicePixelRatio < 2,
    powerPreference: 'high-performance',
  });
  // three logs and limps on when the driver hands back an unusable context;
  // `precision` stays unset in that case, and a silent blank canvas is worse
  // than falling back to the CSS artwork.
  if (!renderer.getContext() || !renderer.capabilities?.precision) {
    renderer.dispose();
    throw new Error('WebGL context is not usable');
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  let envSource = createEnvironmentTexture(palette.ambient, palette.ground);
  let envTarget = pmrem.fromEquirectangular(envSource);
  scene.environment = envTarget.texture;

  const stage = new Group();
  scene.add(stage);

  // ---- The gem: a low-poly icosahedron, flat-shaded so every facet catches light.
  const gemGeometry = new IcosahedronGeometry(1.32, 0);
  const gemMaterial = new MeshStandardMaterial({
    color: new Color(palette.accent),
    metalness: 1,
    roughness: 0.22,
    flatShading: true,
    envMapIntensity: 1.35,
  });
  const gem = new Mesh(gemGeometry, gemMaterial);
  stage.add(gem);

  // ---- Two thin orbiting rings give the silhouette depth without extra draw weight.
  const ringGeometry = new TorusGeometry(2.05, 0.008, 3, 128);
  const ringMaterial = new MeshStandardMaterial({
    color: new Color(palette.accent),
    metalness: 0.9,
    roughness: 0.3,
    transparent: true,
    opacity: 0.55,
  });
  const ringA = new Mesh(ringGeometry, ringMaterial);
  ringA.rotation.set(Math.PI / 2.4, 0, 0.35);
  const ringB = new Mesh(ringGeometry, ringMaterial);
  ringB.rotation.set(Math.PI / 1.7, 0.4, -0.5);
  ringB.scale.setScalar(1.22);
  stage.add(ringA, ringB);

  // ---- Dust motes, additive so they read as light rather than geometry.
  const sparkGeometry = createSparks(160, 2.6);
  const sparkMaterial = new PointsMaterial({
    color: new Color(palette.accent),
    size: 0.022,
    transparent: true,
    opacity: 0.6,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const sparks = new Points(sparkGeometry, sparkMaterial);
  stage.add(sparks);

  const hemi = new HemisphereLight(palette.ambient, palette.ground, 0.7);
  const keyLight = new DirectionalLight(palette.accent, 2.4);
  keyLight.position.set(3, 4, 4);
  const rimLight = new DirectionalLight(palette.ambient, 1.1);
  rimLight.position.set(-4, -1.5, -3);
  scene.add(hemi, keyLight, rimLight);

  // ---- Interaction: pointer nudges a target the scene eases towards.
  const pointer = new Vector2(0, 0);
  const eased = new Vector2(0, 0);

  let running = false;
  let frame = 0;
  let width = 1;
  let height = 1;
  // Time is driven by the rAF timestamp rather than THREE.Clock, which is
  // deprecated as of three 0.186 — and this keeps the paused/resumed case
  // honest, since elapsed only advances while frames are actually drawn.
  let elapsed = 0;
  let lastTimestamp = 0;

  function render(timestamp = 0) {
    const raw = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
    lastTimestamp = timestamp;
    // Clamp so a long pause (hidden tab) does not jump the animation.
    const delta = Math.min(Math.max(raw, 0), 0.05);
    elapsed += delta;

    // Critically-damped-ish easing; frame-rate independent.
    const lerp = 1 - Math.pow(0.0015, delta);
    eased.x += (pointer.x - eased.x) * lerp;
    eased.y += (pointer.y - eased.y) * lerp;

    gem.rotation.y = elapsed * 0.22 + eased.x * 0.5;
    gem.rotation.x = Math.sin(elapsed * 0.35) * 0.12 + eased.y * 0.35;
    stage.position.y = Math.sin(elapsed * 0.6) * 0.07;

    ringA.rotation.z = 0.35 + elapsed * 0.1;
    ringB.rotation.z = -0.5 - elapsed * 0.07;
    sparks.rotation.y = elapsed * 0.04;

    try {
      renderer.render(scene, camera);
    } catch {
      // Context lost mid-flight: stop cleanly rather than spin on a dead GPU.
      running = false;
      return;
    }

    frame = requestAnimationFrame(render);
  }

  // Draw once, synchronously. Two reasons: the canvas is never revealed empty
  // (the animation loop may legitimately be paused — hidden tab, off screen),
  // and any driver-level failure throws here, where the caller can still fall
  // back to the CSS artwork.
  renderer.render(scene, camera);

  return {
    resize(nextWidth, nextHeight) {
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      // A paused scene (hidden tab, scrolled away) would otherwise keep
      // showing the frame drawn at the previous size, stretched.
      if (!running) renderer.render(scene, camera);
    },

    setPointer(x, y) {
      pointer.set(x, y);
    },

    /** Re-bakes the environment when the user flips the theme. */
    setPalette(next) {
      gemMaterial.color.set(next.accent);
      ringMaterial.color.set(next.accent);
      sparkMaterial.color.set(next.accent);
      keyLight.color.set(next.accent);
      rimLight.color.set(next.ambient);
      hemi.color.set(next.ambient);
      hemi.groundColor.set(next.ground);

      envTarget.dispose();
      envSource.dispose();
      envSource = createEnvironmentTexture(next.ambient, next.ground);
      envTarget = pmrem.fromEquirectangular(envSource);
      scene.environment = envTarget.texture;

      if (!running) renderer.render(scene, camera);
    },

    start() {
      if (running) return;
      running = true;
      lastTimestamp = 0;
      frame = requestAnimationFrame(render);
    },

    stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
    },

    dispose() {
      cancelAnimationFrame(frame);
      running = false;
      [gemGeometry, ringGeometry, sparkGeometry].forEach((g) => g.dispose());
      [gemMaterial, ringMaterial, sparkMaterial].forEach((m) => m.dispose());
      envTarget.dispose();
      envSource.dispose();
      pmrem.dispose();
      // dispose() frees the GPU resources. forceContextLoss() is deliberately
      // NOT called: it permanently poisons the <canvas> element, so the next
      // mount onto the same node (React StrictMode, or simply navigating back
      // to this route) could never acquire a context again.
      renderer.dispose();
    },
  };
}
