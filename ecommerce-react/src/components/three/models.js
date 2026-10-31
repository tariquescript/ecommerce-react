/**
 * The storefront's 3D objects, built entirely from code.
 *
 * Every model is a handful of primitives — lathes, extruded silhouettes,
 * rounded boxes and capsules — in a shared glossy "ceramic toy" material set.
 * Nothing is downloaded: no glTF, no textures, no HDRI. The whole library is a
 * few kilobytes inside the lazy three.js chunk.
 *
 * Builders work in whatever units read naturally; the stage re-centres and
 * scales each one to a common radius, so they never need to agree on size.
 *
 * A builder returns:
 *   object  — the Group to draw
 *   motion  — 'spin' (turntable) or 'sway' (front-facing objects rock instead)
 *   yaw     — resting angle, so each object shows its best side
 *   update  — optional per-frame hook for the object's own little act
 *   owned   — materials created just for this instance (disposed with it)
 */
import {
  BoxGeometry,
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ------------------------------------------------------------------ */
/* Materials — one shared instance per finish, so the GPU compiles a   */
/* couple of shader programs for the whole site, not one per object.   */
/* ------------------------------------------------------------------ */

const GLOSS = { clearcoat: 1, clearcoatRoughness: 0.12 };

const FINISHES = {
  porcelain: { color: '#f7f5f0', roughness: 0.3, ...GLOSS },
  tangerine: { color: '#ff6a2b', roughness: 0.36, ...GLOSS },
  butter: { color: '#ffd23f', roughness: 0.34, ...GLOSS },
  blush: { color: '#ff9cbb', roughness: 0.36, ...GLOSS },
  sky: { color: '#8fb7ff', roughness: 0.4, ...GLOSS },
  mint: { color: '#79dbb3', roughness: 0.34, ...GLOSS },
  ink: { color: '#1c1e44', roughness: 0.28, ...GLOSS },
  cobalt: { color: '#2b3ff4', roughness: 0.3, ...GLOSS },
  coffee: { color: '#3a1d10', roughness: 0.1, ...GLOSS },
  // Knit and card stock are matte — gloss on these reads as plastic.
  lilac: { color: '#b3a2ff', roughness: 0.66, clearcoat: 0.2, clearcoatRoughness: 0.5 },
  kraft: { color: '#d39f66', roughness: 0.84, clearcoat: 0.05 },
  toast: { color: '#e9a650', roughness: 0.86, clearcoat: 0.05 },
  chrome: { color: '#eceef6', metalness: 1, roughness: 0.15 },
  lens: {
    color: '#2a1a46',
    roughness: 0.05,
    metalness: 0.3,
    side: DoubleSide,
    ...GLOSS,
    iridescence: 1,
    iridescenceIOR: 1.5,
    iridescenceThicknessRange: [180, 620],
  },
};

const shared = new Map();

function mat(name) {
  let material = shared.get(name);
  if (!material) {
    material = new MeshPhysicalMaterial(FINISHES[name]);
    shared.set(name, material);
  }
  return material;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const v2 = (x, y) => new Vector2(x, y);
const UP = new Vector3(0, 1, 0);

/** A capsule from point a to point b — rounded ends make joints look cast, not glued. */
function rod(a, b, radius, material) {
  const start = new Vector3(...a);
  const dir = new Vector3(...b).sub(start);
  const length = dir.length();
  const mesh = new Mesh(new CapsuleGeometry(radius, length, 6, 14), material);
  mesh.position.copy(start).addScaledVector(dir, 0.5);
  mesh.quaternion.copy(new Quaternion().setFromUnitVectors(UP, dir.normalize()));
  return mesh;
}

function at(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

/** Extrudes a silhouette with a soft bevel and centres it on z. */
function puffy(shape, depth, bevel, material) {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelSegments: 4,
    curveSegments: 16,
  });
  geometry.translate(0, 0, -depth / 2);
  return new Mesh(geometry, material);
}

/** Marks a node that animates on its own, so baking leaves its transform alone. */
function moving(node) {
  node.userData.dynamic = true;
  return node;
}

const toRoot = new Matrix4();
const local = new Matrix4();

/**
 * Collapses a model into one mesh per material.
 *
 * Builders compose objects from many small primitives because that is how they
 * read best; drawing them that way would cost a draw call each. Every static
 * mesh is moved into the root's space and merged with its material-mates, so a
 * rubber duck is four draw calls instead of twelve. Nodes marked with
 * `moving()` keep their own transform and are baked separately inside.
 */
function bake(root) {
  root.updateMatrixWorld(true);
  toRoot.copy(root.matrixWorld).invert();

  const buckets = new Map();
  const merged = [];
  const nested = [];

  const visit = (node) => {
    for (const child of node.children) {
      if (child.userData.dynamic) {
        nested.push(child);
        continue;
      }
      if (child.isMesh) {
        const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
        // The finishes use no textures: position and normal are all a merge needs.
        for (const name of Object.keys(geometry.attributes)) {
          if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
        }
        geometry.clearGroups();
        geometry.applyMatrix4(local.multiplyMatrices(toRoot, child.matrixWorld));
        if (!buckets.has(child.material)) buckets.set(child.material, []);
        buckets.get(child.material).push(geometry);
        merged.push(child);
      }
      visit(child);
    }
  };
  visit(root);

  for (const mesh of merged) {
    mesh.geometry.dispose();
    mesh.removeFromParent();
  }
  for (const [material, geometries] of buckets) {
    const geometry = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries);
    if (geometries.length > 1) geometries.forEach((g) => g.dispose());
    root.add(new Mesh(geometry, material));
  }

  nested.forEach(bake);
}

/** Spring-ish 0→1 ease with a little overshoot, for pops and hops. */
const springOut = (x) => 1 - Math.cos(x * Math.PI * 2.4) * Math.exp(-x * 5.5);

/* ------------------------------------------------------------------ */
/* Aisle objects                                                        */
/* ------------------------------------------------------------------ */

/** Apparel — a striped knit on a hanger, swinging gently from its hook. */
function sweater() {
  const swing = moving(new Group());
  const body = new Group();

  const hangerWood = mat('porcelain');
  body.add(
    rod([0, 1.12, 0], [-1.02, 0.6, 0], 0.05, hangerWood),
    rod([0, 1.12, 0], [1.02, 0.6, 0], 0.05, hangerWood),
    rod([-1.02, 0.6, 0], [1.02, 0.6, 0], 0.035, hangerWood),
    rod([0, 1.1, 0], [0, 1.3, 0], 0.03, mat('chrome'))
  );

  const hook = new Mesh(new TorusGeometry(0.15, 0.03, 10, 28, Math.PI * 1.25), mat('chrome'));
  hook.position.set(0.15, 1.3, 0);
  hook.rotation.z = -Math.PI / 4;
  body.add(hook);

  const s = new Shape();
  s.moveTo(-0.2, 0.6);
  s.quadraticCurveTo(0, 0.42, 0.2, 0.6);
  s.lineTo(0.58, 0.5);
  s.quadraticCurveTo(0.8, 0.42, 0.88, 0.1);
  s.lineTo(1.02, -0.5);
  s.quadraticCurveTo(0.94, -0.62, 0.8, -0.56);
  s.lineTo(0.62, 0);
  s.lineTo(0.6, -0.62);
  s.quadraticCurveTo(0, -0.7, -0.6, -0.62);
  s.lineTo(-0.62, 0);
  s.lineTo(-0.8, -0.56);
  s.quadraticCurveTo(-0.94, -0.62, -1.02, -0.5);
  s.lineTo(-0.88, 0.1);
  s.quadraticCurveTo(-0.8, 0.42, -0.58, 0.5);
  s.closePath();

  const knit = puffy(s, 0.16, 0.09, mat('lilac'));
  knit.position.y = 0.26;
  const stripe = at(new Mesh(new RoundedBoxGeometry(1.3, 0.1, 0.36, 2, 0.04), mat('porcelain')), 0, 0.02, 0);
  const stripe2 = at(new Mesh(new RoundedBoxGeometry(1.3, 0.05, 0.35, 2, 0.02), mat('tangerine')), 0, -0.1, 0);
  body.add(knit, stripe, stripe2);

  // Pivot the swing on the hook, not the garment's centre.
  body.position.set(0, -1.3, 0);
  swing.position.set(0, 1.3, 0);
  swing.add(body);

  const object = new Group();
  object.add(swing);

  return {
    object,
    motion: 'sway',
    yaw: 0.3,
    update(t) {
      swing.rotation.z = Math.sin(t * 1.3) * 0.07;
    },
  };
}

/** Footwear — a chunky sky-blue runner on a porcelain sole. */
function sneaker() {
  const object = new Group();

  const upper = new Shape();
  upper.moveTo(-1.0, 0.16);
  upper.lineTo(-1.04, 0.62);
  upper.quadraticCurveTo(-1.02, 0.86, -0.82, 0.86);
  upper.quadraticCurveTo(-0.62, 0.86, -0.5, 0.72);
  upper.quadraticCurveTo(-0.36, 0.98, -0.18, 0.96);
  upper.quadraticCurveTo(0.2, 0.78, 0.55, 0.56);
  upper.quadraticCurveTo(1.05, 0.42, 1.06, 0.16);
  upper.closePath();
  object.add(puffy(upper, 0.5, 0.13, mat('sky')));

  const sole = new Shape();
  sole.moveTo(-1.02, 0);
  sole.lineTo(0.95, 0);
  sole.quadraticCurveTo(1.24, 0.02, 1.2, 0.22);
  sole.lineTo(-1.1, 0.26);
  sole.quadraticCurveTo(-1.22, 0.1, -1.02, 0);
  object.add(puffy(sole, 0.7, 0.05, mat('porcelain')));

  for (const [x, y] of [[-0.02, 0.97], [0.2, 0.86], [0.4, 0.73]]) {
    object.add(rod([x, y, -0.27], [x + 0.03, y, 0.27], 0.04, mat('porcelain')));
  }

  const tab = new Mesh(new RoundedBoxGeometry(0.14, 0.34, 0.32, 2, 0.05), mat('tangerine'));
  object.add(at(tab, -1.12, 0.66, 0));

  for (const side of [-1, 1]) {
    const flash = new Mesh(new RoundedBoxGeometry(0.62, 0.12, 0.04, 2, 0.02), mat('tangerine'));
    flash.rotation.z = 0.32;
    object.add(at(flash, -0.1, 0.44, side * 0.39));
  }

  return { object, motion: 'sway', yaw: -0.55, tilt: 0.16 };
}

/** Kitchen — a tangerine mug of coffee, steam curling off the top. */
function mug() {
  const object = new Group();
  const glaze = mat('tangerine');

  const profile = [
    v2(0, 0), v2(0.5, 0), v2(0.57, 0.03), v2(0.6, 0.12), v2(0.62, 1.0),
    v2(0.6, 1.06), v2(0.55, 1.06), v2(0.53, 1.0), v2(0.51, 0.16), v2(0.46, 0.12), v2(0, 0.12),
  ];
  object.add(new Mesh(new LatheGeometry(profile, 56), glaze));

  const handle = new Mesh(new TorusGeometry(0.27, 0.075, 14, 32, Math.PI), glaze);
  handle.rotation.z = -Math.PI / 2;
  object.add(at(handle, 0.6, 0.56, 0));

  const coffee = new Mesh(new CircleGeometry(0.515, 40), mat('coffee'));
  coffee.rotation.x = -Math.PI / 2;
  object.add(at(coffee, 0, 0.9, 0));

  // Steam — three puffs on staggered loops. Their own materials, because each
  // fades independently.
  const owned = [];
  const puffs = [0, 1, 2].map((i) => {
    const material = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.9, transparent: true, opacity: 0, depthWrite: false });
    owned.push(material);
    const puff = moving(new Mesh(new SphereGeometry(0.11, 16, 12), material));
    object.add(puff);
    return { puff, material, offset: i / 3 };
  });

  return {
    object,
    motion: 'spin',
    yaw: -0.8,
    owned,
    update(t) {
      for (const { puff, material, offset } of puffs) {
        const p = (t * 0.45 + offset) % 1;
        puff.position.set(Math.sin(p * 7 + offset * 9) * 0.1, 1.08 + p * 0.85, Math.cos(p * 5) * 0.06);
        puff.scale.setScalar(0.55 + p * 1.1);
        material.opacity = Math.sin(p * Math.PI) * 0.7;
      }
    },
  };
}

/** Appliances — a blush retro toaster that pops its toast every few seconds. */
function toaster() {
  const object = new Group();

  object.add(at(new Mesh(new RoundedBoxGeometry(1.6, 1.05, 0.95, 6, 0.3), mat('blush')), 0, 0.525, 0));

  for (const z of [-0.2, 0.2]) {
    object.add(at(new Mesh(new RoundedBoxGeometry(1.1, 0.06, 0.16, 2, 0.03), mat('ink')), 0, 1.04, z));
  }

  const toasts = [-0.2, 0.2].map((z, i) => {
    const slice = moving(new Group());
    slice.add(new Mesh(new RoundedBoxGeometry(0.92, 0.78, 0.09, 3, 0.06), mat('toast')));
    object.add(at(slice, 0, 0.72, z));
    return { slice, lag: i * 0.06 };
  });

  object.add(at(new Mesh(new RoundedBoxGeometry(0.1, 0.12, 0.22, 2, 0.04), mat('chrome')), 0.84, 0.72, 0));
  const dial = new Mesh(new CylinderGeometry(0.1, 0.1, 0.06, 24), mat('chrome'));
  dial.rotation.x = Math.PI / 2;
  object.add(at(dial, 0.5, 0.36, 0.49));
  for (const x of [-0.55, 0.55]) {
    object.add(at(new Mesh(new SphereGeometry(0.07, 12, 8), mat('ink')), x, 0.02, 0.28));
    object.add(at(new Mesh(new SphereGeometry(0.07, 12, 8), mat('ink')), x, 0.02, -0.28));
  }

  return {
    object,
    motion: 'sway',
    yaw: -0.45,
    update(t) {
      const cycle = t % 4.4;
      for (const { slice, lag } of toasts) {
        const c = cycle - lag;
        let lift = 0;
        if (c > 0 && c < 0.7) lift = springOut(c / 0.7);
        else if (c >= 0.7 && c < 2.6) lift = 1;
        else if (c >= 2.6 && c < 3.2) lift = 1 - (c - 2.6) / 0.6;
        slice.position.y = 0.72 + lift * 0.42;
      }
    },
  };
}

/** Bath — a rubber duck, rocking as if on the water. */
function duck() {
  const object = moving(new Group());
  const rubber = mat('butter');

  const body = new Mesh(new SphereGeometry(0.8, 40, 28), rubber);
  body.scale.set(1.25, 0.82, 1.0);
  object.add(at(body, 0, 0.6, 0));

  const tail = new Mesh(new SphereGeometry(0.35, 24, 16), rubber);
  tail.scale.set(1, 0.6, 0.8);
  tail.rotation.z = 0.7;
  object.add(at(tail, -0.9, 0.86, 0));

  object.add(at(new Mesh(new SphereGeometry(0.5, 36, 24), rubber), 0.55, 1.36, 0));

  const beak = new Mesh(new SphereGeometry(0.26, 24, 16), mat('tangerine'));
  beak.scale.set(1.3, 0.45, 1.0);
  object.add(at(beak, 1.0, 1.28, 0));

  for (const z of [-0.22, 0.22]) {
    object.add(at(new Mesh(new SphereGeometry(0.068, 14, 10), mat('ink')), 0.88, 1.48, z));
    object.add(at(new Mesh(new SphereGeometry(0.022, 8, 6), mat('porcelain')), 0.93, 1.52, z * 1.06));
    const wing = new Mesh(new SphereGeometry(0.4, 24, 16), rubber);
    wing.scale.set(1.1, 0.55, 0.3);
    wing.rotation.z = -0.3;
    object.add(at(wing, -0.08, 0.76, z * 3.05));
  }

  const rocker = new Group();
  rocker.add(object);

  return {
    object: rocker,
    motion: 'sway',
    yaw: -0.75,
    update(t) {
      object.rotation.z = Math.sin(t * 1.7) * 0.08;
      object.rotation.x = Math.sin(t * 1.1) * 0.04;
    },
  };
}

/** Bedroom — a bedside lamp that warms up when you hover it. */
function lamp() {
  const object = new Group();

  const base = [v2(0, 0), v2(0.52, 0), v2(0.56, 0.06), v2(0.5, 0.16), v2(0.14, 0.26), v2(0.08, 0.3), v2(0, 0.3)];
  object.add(new Mesh(new LatheGeometry(base, 44), mat('ink')));
  object.add(rod([0, 0.28, 0], [0, 1.06, 0], 0.045, mat('chrome')));

  const bulbMaterial = new MeshPhysicalMaterial({ color: '#fff4dc', emissive: '#ffc864', emissiveIntensity: 1, roughness: 0.4 });
  const shadeMaterial = new MeshPhysicalMaterial({
    color: '#f7f5f0',
    roughness: 0.6,
    side: DoubleSide,
    emissive: '#ffb347',
    emissiveIntensity: 0.2,
  });

  object.add(at(new Mesh(new CylinderGeometry(0.4, 0.68, 0.66, 48, 1, true), shadeMaterial), 0, 1.18, 0));
  object.add(at(new Mesh(new SphereGeometry(0.15, 24, 16), bulbMaterial), 0, 1.08, 0));

  const rimLow = new Mesh(new TorusGeometry(0.68, 0.022, 8, 56), mat('butter'));
  rimLow.rotation.x = Math.PI / 2;
  const rimHigh = new Mesh(new TorusGeometry(0.4, 0.022, 8, 40), mat('butter'));
  rimHigh.rotation.x = Math.PI / 2;
  object.add(at(rimLow, 0, 0.85, 0), at(rimHigh, 0, 1.51, 0));

  return {
    object,
    motion: 'spin',
    yaw: 0,
    owned: [bulbMaterial, shadeMaterial],
    update(t, state) {
      const on = 0.28 + 0.72 * state.hover;
      bulbMaterial.emissiveIntensity = 0.6 + on * 2.6;
      shadeMaterial.emissiveIntensity = 0.08 + on * 0.85;
    },
  };
}

/** Accessories — round sunglasses with iridescent lenses. */
function sunglasses() {
  const object = new Group();
  const frame = mat('ink');
  const capTheta = Math.asin(0.42 / 1.3);

  for (const side of [-1, 1]) {
    object.add(at(new Mesh(new TorusGeometry(0.42, 0.07, 14, 52), frame), side * 0.56, 0, 0));

    const lens = new Mesh(new SphereGeometry(1.3, 40, 8, 0, Math.PI * 2, 0, capTheta), mat('lens'));
    lens.rotation.x = Math.PI / 2;
    object.add(at(lens, side * 0.56, 0, -1.3 * Math.cos(capTheta) + 0.01));

    object.add(rod([side * 0.98, 0.1, 0], [side * 1.03, 0.1, -1.2], 0.04, frame));
    object.add(rod([side * 1.03, 0.1, -1.2], [side * 1.0, -0.14, -1.48], 0.04, frame));
  }

  object.add(at(new Mesh(new TorusGeometry(0.14, 0.045, 10, 24, Math.PI), frame), 0, 0.1, 0));

  return { object, motion: 'sway', yaw: 0.5, tilt: 0.2 };
}

/** Sports — a mint kettlebell with an ink racing band. */
function kettlebell() {
  const object = new Group();
  const cast = mat('mint');

  const bell = new Mesh(new SphereGeometry(0.75, 44, 32), cast);
  bell.scale.y = 0.94;
  object.add(at(bell, 0, 0.7, 0));
  object.add(at(new Mesh(new CylinderGeometry(0.42, 0.44, 0.06, 32), cast), 0, 0.03, 0));

  const band = new Mesh(new TorusGeometry(0.752, 0.035, 10, 64), mat('ink'));
  band.rotation.x = Math.PI / 2;
  object.add(at(band, 0, 0.7, 0));

  object.add(at(new Mesh(new TorusGeometry(0.4, 0.11, 16, 44, Math.PI), cast), 0, 1.28, 0));
  object.add(rod([-0.4, 1.28, 0], [-0.34, 1.08, 0], 0.11, cast));
  object.add(rod([0.4, 1.28, 0], [0.34, 1.08, 0], 0.11, cast));

  return { object, motion: 'spin', yaw: 0.4 };
}

/* ------------------------------------------------------------------ */
/* Service objects — shipping, returns, cover, bag, checkout            */
/* ------------------------------------------------------------------ */

/** A kraft parcel with cobalt tape and a shipping label. */
function parcel() {
  const object = new Group();

  object.add(at(new Mesh(new RoundedBoxGeometry(1.5, 1.0, 1.1, 4, 0.06), mat('kraft')), 0, 0.5, 0));

  const tape = mat('cobalt');
  object.add(at(new Mesh(new BoxGeometry(0.3, 0.014, 1.104), tape), 0, 1.002, 0));
  object.add(at(new Mesh(new BoxGeometry(0.3, 0.42, 0.014), tape), 0, 0.79, 0.552));
  object.add(at(new Mesh(new BoxGeometry(0.3, 0.42, 0.014), tape), 0, 0.79, -0.552));

  object.add(at(new Mesh(new RoundedBoxGeometry(0.5, 0.32, 0.02, 2, 0.01), mat('porcelain')), -0.4, 0.36, 0.556));
  [0.03, 0.015, 0.03, 0.02, 0.012, 0.03, 0.02].reduce((x, width) => {
    object.add(at(new Mesh(new BoxGeometry(width, 0.16, 0.01), mat('ink')), x, 0.33, 0.568));
    return x + width + 0.022;
  }, -0.57);

  return { object, motion: 'spin', yaw: -0.6, tilt: 0.22 };
}

/** Free returns — a looping arrow that keeps coming back around. */
function returns() {
  const loop = moving(new Group());
  const glaze = mat('tangerine');

  loop.add(new Mesh(new TorusGeometry(0.62, 0.15, 18, 72, Math.PI * 1.5), glaze));
  const head = new Mesh(new ConeGeometry(0.3, 0.44, 28), glaze);
  head.rotation.z = -Math.PI / 2;
  loop.add(at(head, 0.2, -0.62, 0));

  const object = new Group();
  object.add(loop);

  return {
    object,
    motion: 'sway',
    yaw: 0.25,
    update(t) {
      loop.rotation.z = -t * 0.9;
    },
  };
}

/** Cover — a cobalt shield with an embossed tick. */
function shield() {
  const object = new Group();

  const s = new Shape();
  s.moveTo(-0.72, 0.62);
  s.quadraticCurveTo(0, 0.94, 0.72, 0.62);
  s.lineTo(0.72, 0.05);
  s.quadraticCurveTo(0.68, -0.6, 0, -0.96);
  s.quadraticCurveTo(-0.68, -0.6, -0.72, 0.05);
  s.closePath();
  object.add(puffy(s, 0.2, 0.12, mat('cobalt')));

  const tick = mat('porcelain');
  const z = 0.26;
  object.add(rod([-0.3, 0.02, z], [-0.08, -0.24, z], 0.075, tick));
  object.add(rod([-0.08, -0.24, z], [0.34, 0.3, z], 0.075, tick));

  return { object, motion: 'sway', yaw: -0.3 };
}

/** The TariqueScript monogram, as three extruded polygons in SVG units. */
function monogram(material, width) {
  const polygons = [
    [[0, 0], [281, 0], [281, 41], [0, 41]],
    [[162, 58], [281, 58], [281, 101], [209, 101], [209, 203], [162, 232]],
    [[0, 58], [146, 58], [146, 261], [100, 291], [100, 101], [0, 101]],
  ];
  const shapes = polygons.map((points) => new Shape(points.map(([x, y]) => v2(x, -y))));
  const geometry = new ExtrudeGeometry(shapes, { depth: 26, bevelEnabled: true, bevelThickness: 6, bevelSize: 5, bevelSegments: 2 });
  const scale = width / 281;
  geometry.scale(scale, scale, scale);
  geometry.translate(-width / 2, (291 * scale) / 2, 0);
  return new Mesh(geometry, material);
}

/** A tangerine shopping bag stamped with the monogram. */
function bag() {
  const object = new Group();

  object.add(at(new Mesh(new RoundedBoxGeometry(1.2, 1.36, 0.6, 4, 0.05), mat('tangerine')), 0, 0.68, 0));

  for (const z of [-0.18, 0.18]) {
    object.add(at(new Mesh(new TorusGeometry(0.28, 0.035, 10, 32, Math.PI), mat('ink')), 0, 1.36, z));
  }

  object.add(at(monogram(mat('porcelain'), 0.46), 0, 0.68, 0.3));

  return { object, motion: 'spin', yaw: -0.5 };
}

/** Secure checkout — a padlock whose shackle lifts when you hover it. */
function padlock() {
  const object = new Group();

  object.add(at(new Mesh(new RoundedBoxGeometry(1.1, 0.9, 0.42, 5, 0.14), mat('cobalt')), 0, 0.45, 0));

  const shackle = moving(new Group());
  shackle.add(at(new Mesh(new TorusGeometry(0.33, 0.085, 14, 36, Math.PI), mat('chrome')), 0, 0.75, 0));
  shackle.add(rod([-0.33, 0.75, 0], [-0.33, 0.42, 0], 0.085, mat('chrome')));
  shackle.add(rod([0.33, 0.75, 0], [0.33, 0.42, 0], 0.085, mat('chrome')));
  object.add(shackle);

  const keyhole = new Mesh(new CylinderGeometry(0.08, 0.08, 0.04, 20), mat('ink'));
  keyhole.rotation.x = Math.PI / 2;
  object.add(at(keyhole, 0, 0.5, 0.215));
  object.add(at(new Mesh(new BoxGeometry(0.06, 0.16, 0.04), mat('ink')), 0, 0.4, 0.215));

  return {
    object,
    motion: 'sway',
    yaw: -0.35,
    update(t, state) {
      shackle.position.y = state.hover * 0.2;
      shackle.rotation.y = state.hover * 0.5;
    },
  };
}

const BUILDERS = {
  sweater,
  sneaker,
  mug,
  toaster,
  duck,
  lamp,
  sunglasses,
  kettlebell,
  parcel,
  returns,
  shield,
  bag,
  padlock,
};

export const MODEL_KINDS = Object.keys(BUILDERS);

export function buildModel(kind) {
  const model = (BUILDERS[kind] ?? bag)();
  bake(model.object);
  return model;
}

/** Frees the GPU buffers a model instance owns; shared finishes stay cached. */
export function disposeModel(model) {
  model.object.traverse((node) => node.geometry?.dispose());
  model.owned?.forEach((material) => material.dispose());
}
