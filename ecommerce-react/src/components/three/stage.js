/**
 * One WebGL renderer for every 3D object on the site.
 *
 * Browsers cap live WebGL contexts at roughly sixteen, and each one carries
 * its own shader cache, buffers and memory. A page with a dozen small models
 * therefore can't give each its own <canvas>. The usual workaround — one big
 * fixed canvas scissored to follow DOM elements — lags a frame behind native
 * scrolling, which is visible on every scroll.
 *
 * This takes a third route:
 *   • a single off-screen WebGLRenderer draws each visible model in turn,
 *   • the result is blitted into a plain 2D <canvas> that lives in the slot,
 *   • so the pixels scroll with the document exactly like an image does.
 *
 * Budget discipline, because this must never cost the page its speed:
 *   • nothing renders unless its slot is on screen (one shared IntersectionObserver)
 *   • the loop stops completely when nothing is visible or the tab is hidden
 *   • device pixel ratio is capped at 2; the back buffer only ever grows to the
 *     largest slot, never per-slot
 *   • reduced-motion visitors get one still frame per slot, no loop at all
 *   • every geometry and per-instance material is disposed on unmount
 */
import {
  Box3,
  CanvasTexture,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Sphere,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildModel, disposeModel } from './models.js';

const MAX_DPR = 2;
/** Every model is scaled so its bounding sphere has this radius. */
const FIT_RADIUS = 1.3;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const easeOutBack = (x) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};

/** Soft contact shadow — a 64px radial gradient, far cheaper than a shadow map. */
function createShadowTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(8, 10, 40, 0.5)');
  gradient.addColorStop(0.45, 'rgba(8, 10, 40, 0.2)');
  gradient.addColorStop(1, 'rgba(8, 10, 40, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

let instance = null;

/** Lazily creates the singleton. Throws when WebGL is missing or unusable. */
export function getStage() {
  if (!instance) instance = createStage();
  return instance;
}

function createStage() {
  const canvas = document.createElement('canvas');
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  // three limps on with a context the driver handed back unusable; `precision`
  // stays unset in that case, and a blank slot is worse than the CSS fallback.
  if (!renderer.getContext() || !renderer.capabilities?.precision) {
    renderer.dispose();
    throw new Error('WebGL context is not usable');
  }

  // Slots apply their own device pixel ratio; the renderer works in raw pixels.
  renderer.setPixelRatio(1);
  renderer.toneMapping = NeutralToneMapping; // keeps brand colours true, unlike ACES
  renderer.toneMappingExposure = 1.04;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setScissorTest(true);

  const scene = new Scene();

  // A procedural studio room baked once into an environment map: real
  // reflections on the glossy finishes, with zero bytes downloaded.
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();

  const hemi = new HemisphereLight('#ffffff', '#8a90c8', 0.55);
  const key = new DirectionalLight('#ffffff', 1.5);
  key.position.set(2.5, 4, 3.5);
  scene.add(hemi, key);

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.5, 5.6);
  camera.lookAt(0, 0, 0);

  const shadowTexture = createShadowTexture();
  const shadowGeometry = new PlaneGeometry(1, 1);

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animate = !motionQuery.matches;

  /** @type {Set<any>} */
  const slots = new Set();
  const byHost = new Map();
  const pointer = { x: 0, y: 0, active: false };

  let bufferWidth = 0;
  let bufferHeight = 0;
  let frameId = 0;
  let lastTime = 0;
  let lost = false;

  /* ---------------- loop ---------------- */

  function wake() {
    if (frameId || lost || document.hidden) return;
    lastTime = performance.now();
    frameId = requestAnimationFrame(tick);
  }

  function sleep() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function tick(now) {
    frameId = 0;
    const dt = clamp((now - lastTime) / 1000, 0, 0.05);
    lastTime = now;

    let running = false;
    for (const slot of slots) {
      if (!slot.visible || !slot.cssWidth) continue;
      if (animate) {
        step(slot, dt);
        draw(slot);
        running = true;
      } else if (slot.dirty) {
        slot.state.intro = 1;
        pose(slot);
        draw(slot);
      }
      slot.dirty = false;
    }

    if (running) frameId = requestAnimationFrame(tick);
  }

  /** Advances one slot's springs: hover, pointer tilt and the intro pop. */
  function step(slot, dt) {
    const s = slot.state;
    const k = 1 - Math.exp(-dt * 7);
    slot.age += dt;

    s.hover += ((slot.hovered ? 1 : 0) - s.hover) * k;

    let tx = 0;
    let ty = 0;
    if (slot.hovered) {
      tx = slot.local.x;
      ty = slot.local.y;
    } else if (pointer.active) {
      // Unhovered objects still glance toward the cursor, so the page feels alive.
      const r = slot.host.getBoundingClientRect();
      tx = clamp((pointer.x - (r.left + r.width / 2)) / window.innerWidth, -1, 1) * 0.6;
      ty = clamp(-(pointer.y - (r.top + r.height / 2)) / window.innerHeight, -1, 1) * 0.5;
    }
    s.px += (tx - s.px) * k;
    s.py += (ty - s.py) * k;

    slot.time += dt * (1 + s.hover * 1.6);
    if (slot.age > slot.delay) s.intro = Math.min(1, s.intro + dt / 0.9);

    pose(slot);
  }

  function pose(slot) {
    const { model, pivot, state: s } = slot;
    const t = slot.time;
    const pop = animate ? easeOutBack(s.intro) : 1;

    pivot.scale.setScalar(Math.max(pop, 1e-4));
    const yaw = model.yaw ?? 0;
    pivot.rotation.y =
      model.motion === 'spin'
        ? yaw + t * 0.5 + s.px * 0.7
        : yaw + Math.sin(t * 0.7) * 0.42 + s.px * 0.8;
    pivot.rotation.x = (model.tilt ?? 0.12) - s.py * 0.32;

    const lift = Math.sin(t * 1.5 + slot.phase) * 0.05 + s.hover * 0.12;
    pivot.position.y = lift;
    slot.shadow.scale.setScalar(slot.shadowSize * (1 - lift * 0.9) * Math.min(pop, 1));
    slot.shadow.material.opacity = 0.9 - lift * 1.6;

    model.update?.(t, s);
  }

  /** Renders one slot into the shared buffer, then copies it into the slot's own canvas. */
  function draw(slot) {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = Math.max(1, Math.round(slot.cssWidth * dpr));
    const h = Math.max(1, Math.round(slot.cssHeight * dpr));

    if (slot.canvas.width !== w || slot.canvas.height !== h) {
      slot.canvas.width = w;
      slot.canvas.height = h;
    }
    if (w > bufferWidth || h > bufferHeight) {
      bufferWidth = Math.max(bufferWidth, w);
      bufferHeight = Math.max(bufferHeight, h);
      renderer.setSize(bufferWidth, bufferHeight, false);
    }

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setViewport(0, 0, w, h);
    renderer.setScissor(0, 0, w, h);

    slot.holder.visible = true;
    renderer.render(scene, camera);
    slot.holder.visible = false;

    // GL's origin is bottom-left, the 2D canvas's is top-left: the slot's
    // pixels are the bottom `h` rows of the back buffer.
    slot.ctx.clearRect(0, 0, w, h);
    slot.ctx.drawImage(canvas, 0, bufferHeight - h, w, h, 0, 0, w, h);

    if (!slot.live) {
      slot.live = true;
      slot.host.classList.add('is-live');
    }
  }

  /* ---------------- observers ---------------- */

  const visibility = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const slot = byHost.get(entry.target);
        if (!slot) continue;
        slot.visible = entry.isIntersecting;
        if (slot.visible) slot.dirty = true;
      }
      wake();
    },
    { rootMargin: '120px 0px' }
  );

  const sizes = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const slot = byHost.get(entry.target);
      if (!slot) continue;
      slot.cssWidth = entry.contentRect.width;
      slot.cssHeight = entry.contentRect.height;
      slot.dirty = true;
    }
    wake();
  });

  window.addEventListener(
    'pointermove',
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = event.pointerType === 'mouse';
    },
    { passive: true }
  );

  document.addEventListener('visibilitychange', () => (document.hidden ? sleep() : wake()));

  motionQuery.addEventListener('change', (event) => {
    animate = !event.matches;
    for (const slot of slots) slot.dirty = true;
    wake();
  });

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    sleep();
    // Hand every slot back to its CSS stand-in until the GPU returns.
    for (const slot of slots) {
      slot.live = false;
      slot.host.classList.remove('is-live');
    }
  });

  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    for (const slot of slots) slot.dirty = true;
    wake();
  });

  /* ---------------- public API ---------------- */

  /** Wraps a model in pivot (animated) and holder (pivot + shadow) groups, fitted to a common size. */
  function frame(model) {
    const inner = model.object;
    inner.updateMatrixWorld(true);
    const box = new Box3().setFromObject(inner);
    const centre = box.getCenter(new Vector3());
    const radius = box.getBoundingSphere(new Sphere()).radius || 1;
    const scale = FIT_RADIUS / radius;

    const fit = new Group();
    fit.scale.setScalar(scale);
    inner.position.sub(centre);
    fit.add(inner);

    const pivot = new Group();
    pivot.add(fit);

    const shadow = new Mesh(
      shadowGeometry,
      new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -((box.max.y - box.min.y) / 2) * scale - 0.06;

    const holder = new Group();
    holder.add(pivot, shadow);
    holder.visible = false;

    const footprint = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * scale;
    return { holder, pivot, shadow, shadowSize: clamp(footprint * 1.35, 1.4, 2.8) };
  }

  /**
   * Starts drawing `kind` into `host`. Returns a handle whose dispose()
   * removes everything it added.
   *
   * @param {HTMLElement} host
   * @param {string} kind
   * @param {{ delay?: number }} [options] delay in ms before the intro pop
   */
  function mount(host, kind, { delay = 0 } = {}) {
    if (lost) throw new Error('WebGL context lost');

    const slotCanvas = document.createElement('canvas');
    slotCanvas.className = 'model-slot__canvas';
    host.appendChild(slotCanvas);

    const model = buildModel(kind);
    const framed = frame(model);
    scene.add(framed.holder);

    const slot = {
      host,
      canvas: slotCanvas,
      ctx: slotCanvas.getContext('2d'),
      model,
      ...framed,
      visible: false,
      dirty: true,
      live: false,
      cssWidth: 0,
      cssHeight: 0,
      hovered: false,
      local: { x: 0, y: 0 },
      state: { hover: 0, px: 0, py: 0, intro: 0 },
      time: Math.random() * 6,
      phase: Math.random() * Math.PI * 2,
      age: 0,
      delay: delay / 1000,
    };

    // The interactive surface is the nearest [data-model-host] — a shelf
    // button, a ticket — so the whole card drives the model, not just its box.
    const surface = host.closest('[data-model-host]') ?? host;
    const onEnter = () => {
      slot.hovered = true;
      wake();
    };
    const onLeave = () => {
      slot.hovered = false;
      slot.local.x = 0;
      slot.local.y = 0;
    };
    const onMove = (event) => {
      const r = surface.getBoundingClientRect();
      slot.local.x = ((event.clientX - r.left) / r.width) * 2 - 1;
      slot.local.y = -(((event.clientY - r.top) / r.height) * 2 - 1);
    };

    surface.addEventListener('pointerenter', onEnter);
    surface.addEventListener('pointerleave', onLeave);
    surface.addEventListener('pointermove', onMove, { passive: true });
    // Keyboard focus animates the model too — hover is not the only way in.
    surface.addEventListener('focusin', onEnter);
    surface.addEventListener('focusout', onLeave);

    slots.add(slot);
    byHost.set(host, slot);
    visibility.observe(host);
    sizes.observe(host);

    return {
      dispose() {
        surface.removeEventListener('pointerenter', onEnter);
        surface.removeEventListener('pointerleave', onLeave);
        surface.removeEventListener('pointermove', onMove);
        surface.removeEventListener('focusin', onEnter);
        surface.removeEventListener('focusout', onLeave);
        visibility.unobserve(host);
        sizes.unobserve(host);
        slots.delete(slot);
        byHost.delete(host);
        scene.remove(slot.holder);
        slot.shadow.material.dispose();
        disposeModel(model);
        slotCanvas.remove();
        host.classList.remove('is-live');
      },
    };
  }

  return { mount };
}
