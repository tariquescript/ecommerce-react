# TariqueScript — Storefront

A production-minded e-commerce front end built with React 19, Vite and three.js.
Dark-first design system, optimistic cart, responsive AVIF imagery, and a WebGL
hero that never gets in the way of the page loading.

**Live:** https://ecommerce-ts-react.vercel.app

---

## What this is

It began as a course project and was rebuilt end to end: the architecture, the
data layer, the design system, the asset pipeline and the rendering strategy are
all new. The Express API it talks to is unchanged, which made it a useful
constraint — every improvement here had to come from the client.

## Performance

The headline problem was the asset payload. Product photography shipped as 42
JPEGs at 720×720, ~325 KB each, rendered into cards roughly 280 CSS px wide.

| | Before | After |
|---|---|---|
| Product imagery on disk | 13.6 MB | 5.7 MB across 3 widths × 3 formats |
| Per card, as served | ~325 KB JPEG | **~6 KB AVIF** at 400w |
| Above-the-fold images | ~2.6 MB | ~24 KB |
| Icon requests | 8 PNGs | 0 — inline SVG |
| Star-rating requests | 1 PNG per card | 0 — one clipped SVG |
| Navigation | full page reload per link | client-side route |
| Runtime dependencies | 5 | 4 (axios and dayjs removed) |

**JS over the wire, gzipped:** ~15 KB app + ~69 KB React/Router + ~6 KB CSS.
three.js is 126 KB gzipped and lives in its own chunk that is never fetched
until the browser is idle — and not at all on hardware that asks not to have it.

### How

- **Build-time image ladder** — `scripts/optimize-images.mjs` emits AVIF, WebP
  and JPEG at 240/400/720 px, plus a 155-byte blur placeholder and a dominant
  colour per product. Cards paint instantly on a cold cache and never shift,
  because width and height are always declared.
- **Route-level code splitting** — the landing route ships in the main bundle;
  checkout, orders and tracking are lazy.
- **Stale-while-revalidate data layer** — a ~2 KB fetch client replaces axios,
  with in-flight de-duplication, bounded retry with backoff (the API is a
  cold-starting serverless function) and cache invalidation on write.
- **Optimistic cart** — adds, quantity changes, delivery choices and removals
  apply locally and reconcile in the background. A failed request rolls the
  cart back to its snapshot and says so.
- **Idle-gated WebGL** — the hero scene loads after first paint, pauses when it
  scrolls out of view or the tab is hidden, caps DPR at 1.75, and is skipped
  entirely on save-data, slow connections, reduced-motion and low-core devices.
- **One font file** — Inter Variable, latin subset only, self-hosted and
  preloaded. No third-party font request.

## Architecture

```
src/
  app/              router, providers, error boundary
  features/
    cart/           context + pure reducer + drawer
    catalog/        hero, grid, card, filtering
    checkout/       order review, delivery, payment summary
    orders/         order history
    tracking/       parcel progress
  components/
    layout/         header, footer
    ui/             Button, Icon, Rating, ProductImage, Skeleton, …
    three/          WebGL scene + its React wrapper
  lib/
    api/            fetch client with cache, dedupe, retry
    hooks/          useResource, useReveal, useIdle, …
    images/         generated manifest + srcset resolver
  styles/           tokens, base, shared components
```

A few decisions worth calling out:

- **Contexts live apart from their providers** (`cart-context.js` vs
  `CartProvider.jsx`) so provider modules export only components and React Fast
  Refresh keeps working.
- **The cart reducer is a pure function** in its own module, which is why the
  optimistic-update behaviour can be tested without mounting React.
- **Design tokens are the only source of colour.** The light/dark swap is a
  token redefinition, nothing more — no component knows which theme is active.
- **Category shelves separate match order from display order**, so an espresso
  maker tagged both `kitchen` and `espresso makers` files under Appliances while
  Kitchen still appears first in the filter bar.

## Bugs fixed from the original

- Every `<a href>` triggered a full page reload instead of a client route.
- `class` instead of `className` throughout.
- `/tracking` crashed — `Header` was rendered without the `cartItems` it reads.
- Order totals rendered as `$$35.06` (a literal `$` plus `formatMoney`).
- Order dates showed "Invalid Date" — the code read `order.date` and
  `order.estimatedDeliveryTimeMs`; the API returns `orderTimeMs` and puts the
  delivery estimate on each line.
- Order line names came from `orderProduct.name`, which is undefined.
- Missing React `key`s in the checkout list.
- `alert()` on every failed request.
- Diagnostic `console.log`s in the API layer, shipped to production.

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
| `npm run images:optimize` | regenerate the image ladder (skips existing) |
| `npm run images:rebuild` | regenerate everything from scratch |
| `npm run fonts:sync` | re-copy the font subset after a dependency bump |

Original photography lives in `art-source/` and is not deployed; `public/media`
is generated from it and is committed so deploys need no image step.

## Accessibility

Keyboard-reachable throughout, with a skip link, a focus-trapped cart drawer,
Escape-to-close, `aria-live` on the cart count and search results, real
`fieldset`/`legend` radio groups for delivery options, and visible focus rings
that stay out of the way of mouse users. `prefers-reduced-motion` disables every
animation, the entrance reveals and the WebGL scene.

## Tests

37 tests over the logic that carries risk: cart state transitions including the
optimistic rollback path, money and relative-date formatting, the image srcset
resolver and its unknown-product fallback, delivery-stage derivation, and
category rollup.

```bash
npm test
```
