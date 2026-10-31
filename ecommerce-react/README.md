# TariqueScript — Storefront

A production-minded e-commerce front end built with React 19, Vite and three.js.
A cobalt-and-porcelain design system, a shelf of live 3D objects drawn by a
single shared WebGL renderer, an optimistic cart, and a catalogue that paints on
the first frame — even while the API is still waking up.

**Live:** https://ecommerce-ts-react.vercel.app

---

## What this is

It began as a course project and was rebuilt end to end: the architecture, the
data layer, the design system, the asset pipeline and the rendering strategy are
all new. The Express API it talks to is unchanged, which made it a useful
constraint — every improvement here had to come from the client.

## Design

**Cobalt & porcelain, with tangerine for the things that sell.** A saturated
cobalt stage (hero and footer), warm porcelain paper for browsing, and tangerine
reserved for primary actions and prices that need to be found. Type is
**Funnel Display** for headlines and **Funnel Sans** for everything else.

The visual language is *retail ephemera* — the paper that surrounds shopping:

- **Hang-tag prices** that swing on their string when you reach for a product.
- **Admission tickets** for the shipping promises, with punched notches and a
  perforated stub.
- **A till receipt** for a footer, which feeds out of a printer slot in short
  mechanical jerks when it scrolls into view.
- **Packing slips and rubber stamps** for order history; **barcodes** derived
  from order ids, so a slip and its receipt always match.

Every aisle has its own tint. Product photography is multiplied onto it, so
white-ground shots sit on colour and lifestyle shots pick up a subtle per-aisle
grade — the same tint follows a product from the grid to the bag, checkout and
tracking.

**The hero is a shopfront, drawn in CSS** — a fascia sign whose lettering
flickers on like a lit sign, a striped awning that unrolls with a scalloped
edge, and a lit shop window with an OPEN sign swinging behind the glass (it
flips to "60-day returns" on hover) and a slow highlight sweeping across it.
By night the facade goes dark and the window glows warm. The window display
*is* the aisle navigation: each object in it is a real button that filters the
catalogue.

**Small 3D objects live all over the site** — a sweater on a hanger, a sneaker,
a mug that steams, a toaster that pops its toast, a rubber duck, a lamp that
warms up when hovered, sunglasses with iridescent lenses, a kettlebell, a parcel,
a returns arrow, a shield, a shopping bag stamped with the monogram and a
padlock whose shackle lifts.

Motion is CSS and the Web Animations API — no animation library:

- the shopfront assembles itself: the sign lights, the awning unrolls, the
  window's objects pop onto the shelf one by one;
- adding to the bag flies the product photo along a true curved arc into the
  header, which bumps on arrival;
- filtering and re-sorting the grid **morphs** tiles to their new positions via
  the View Transitions API;
- page navigations cross-fade with the header held in place;
- the active aisle pill glides between tabs; buttons fill from the exact point
  the cursor entered.

## Performance

| | Before the rebuild | Now |
|---|---|---|
| Per product card, as served | ~325 KB JPEG | **~6 KB AVIF** at 400w |
| Above-the-fold images | ~2.6 MB | 0 — the hero is CSS and 3D |
| Catalogue first paint | after the API responds | **first frame**, from a 3 KB snapshot |
| Fonts | — | 35 KB, two self-hosted latin subsets |
| 3D assets downloaded | — | **0 bytes** — every model is procedural |
| WebGL contexts | — | **1**, however many objects are on screen |

**Critical path, gzipped:** ~23 KB app + ~87 KB React/Router + ~10 KB CSS.
three.js (142 KB) and the stage (6 KB) are their own chunks, fetched only once
the browser is idle after first paint — and not at all on save-data, 2G or
low-core hardware.

### How

- **One renderer, many canvases** — `components/three/stage.js` owns a single
  off-screen `WebGLRenderer`. Each `<ModelSlot>` holds a plain 2D canvas; the
  stage draws every *visible* model in turn and blits the pixels into its slot.
  Browsers cap live WebGL contexts at around sixteen, and the usual workaround —
  one fixed canvas scissored to follow DOM elements — lags a frame behind native
  scrolling. Blitting into in-flow canvases scrolls exactly like an image.
- **Budgeted** — one shared IntersectionObserver decides what renders; the loop
  stops when nothing is visible or the tab is hidden; DPR is capped at 2; the
  back buffer only ever grows to the largest slot; reduced-motion visitors get
  one still frame per slot and no loop at all.
- **Procedural everything** — models are lathes, extrusions, rounded boxes and
  capsules; reflections come from a procedural studio room baked once into an
  environment map; contact shadows are a 64px gradient. Shared finishes mean a
  handful of shader programs for the whole site.
- **Snapshot-seeded catalogue** — `npm run catalog:snapshot` writes the API's
  own seed data into the bundle. It is stored as already stale, so the first
  read paints it and revalidates against the live API in the same breath. A
  cold-starting serverless function never stands between a visitor and the grid.
- **A data router** — React Router's `createBrowserRouter` resolves lazy pages
  *before* swapping, so there is never a blank Suspense frame between pages;
  it also brings View Transitions and scroll restoration.
- **Cart state and cart actions are separate contexts** — the 42 product cards
  read only the (stable) actions and get their quantity as a prop, so adding one
  product re-renders one card, not the grid.
- **Build-time image ladder** — `scripts/optimize-images.mjs` emits AVIF, WebP
  and JPEG at 240/400/720 px plus a 155-byte blur placeholder per product.
- **Stale-while-revalidate data layer** — a ~2 KB fetch client with in-flight
  de-duplication, bounded retry with backoff, and cache invalidation on write.
  Render only ever *peeks* at the cache; the network is touched from effects.
- **Optimistic cart** — adds, quantity changes, delivery choices and removals
  apply locally and reconcile in the background; a failure rolls back and says so.

## Architecture

```
src/
  app/              data router, root layout, route error boundary, providers
  features/
    cart/           state/actions contexts, pure reducer, drawer, fly-to-bag
    catalog/        shopfront hero, promise tickets, toolbar, tiles, aisles
    checkout/       order review, delivery tickets, receipt summary
    orders/         packing slips
    tracking/       route with a parcel that drives to its real progress
  components/
    layout/         header capsule, receipt footer
    ui/             Button, Icon, Rating, ProductImage, ProductThumb, Barcode, …
    three/          stage (shared renderer), models, ModelSlot, lazy loader
  lib/
    api/            fetch client (cache, dedupe, retry, seed), catalogue snapshot
    hooks/          useResource, useReveal, …
    images/         generated manifest + srcset resolver
    morph.js        View Transition helper for in-place layout changes
  styles/           tokens, base, shared components
```

A few decisions worth calling out:

- **three.js has exactly one door.** `load-stage.js` is the only module that
  imports it, from an idle callback; nothing in the critical path can pull it in.
- **Every 3D slot has a designed stand-in** — a glossy pebble in the object's
  colour — so the layout is identical with or without WebGL.
- **Design tokens are the only source of colour.** Day and night are token
  redefinitions; aisle tints are tokens too.
- **Contexts live apart from their providers** so provider modules export only
  components and React Fast Refresh keeps working.

## Bugs fixed from the original

- Every `<a href>` triggered a full page reload instead of a client route.
- `class` instead of `className` throughout.
- `/tracking` crashed — `Header` was rendered without the `cartItems` it reads.
- Order totals rendered as `$$35.06`; order dates showed "Invalid Date"; order
  line names were undefined; React `key`s were missing in checkout.
- `alert()` on every failed request; `console.log`s shipped to production.

And from the previous version of this storefront:

- **Round Sunglasses were filed under Bedroom** — the API tags them "shades",
  which the Bedroom shelf also claimed (for window shades) and matched first.
- **Every product card re-rendered on every cart change**, despite `memo()`,
  because each card consumed the whole cart context.
- **Opening a new URL in the same tab inherited the previous page's scroll
  position** — React Router keys every document's first entry as `"default"`.
- **Re-renders could start stray background requests** (and surface unhandled
  rejections when the API was unreachable) because the data hook read the cache
  through the fetching path.

## Running it

The storefront needs the API from `../ecommerce-backend` on port 3000.

```bash
# terminal 1 — API
cd ecommerce-backend && npm install && npm start

# terminal 2 — storefront
cd ecommerce-react && npm install && npm run dev
```

In development `VITE_API_URL` is empty on purpose: requests stay same-origin and
go through the Vite proxy, so there is no CORS to configure. The deployed origin
comes from `.env.production`.

| Script | |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run preview` | serve the build locally |
| `npm test` | vitest, single run |
| `npm run lint` | eslint |
| `npm run catalog:snapshot` | regenerate the first-paint catalogue from the API's seed data |
| `npm run images:optimize` | regenerate the image ladder (skips existing) |
| `npm run images:rebuild` | regenerate everything from scratch |
| `npm run fonts:sync` | re-copy the font subsets after a dependency bump |

Original photography lives in `art-source/` and is not deployed; `public/media`
is generated from it and is committed so deploys need no image step.

## Accessibility

Keyboard-reachable throughout: a skip link, a focus-trapped cart drawer that
returns focus to whatever opened it, Escape-to-close, `/` to jump to search,
the shop window's 3D objects are real buttons (keyboard focus animates them too),
spoken confirmation when something is added to the bag, `aria-live` on result
counts, `fieldset`/`legend` radio groups for delivery, and a sign whose
individually animated words still read as one heading. `prefers-reduced-motion`
removes every animation and freezes the 3D objects as still frames.

## Tests

52 tests over the logic that carries risk: cart state transitions including the
optimistic rollback path, the cache layer (seeding, peeking, de-duplication,
quiet prefetch failure), category rollup and counts, aisle dressing, barcode
determinism, money and date formatting, the srcset resolver, and delivery-stage
derivation.

```bash
npm test
```
