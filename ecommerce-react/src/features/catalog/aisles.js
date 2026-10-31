import { categoryOf } from './categories.js';

/**
 * Each shelf from categories.js, dressed: the 3D object that stands for it on
 * the hero shelf, and the tint its product photography is multiplied onto.
 * Tints are token references, so a theme can restyle every aisle at once.
 */
export const AISLES = {
  Apparel: { model: 'sweater', tint: 'var(--tint-apparel)', note: 'Knits, tees & lounge' },
  Footwear: { model: 'sneaker', tint: 'var(--tint-footwear)', note: 'Runners, flats & heels' },
  Kitchen: { model: 'mug', tint: 'var(--tint-kitchen)', note: 'Cookware & tableware' },
  Appliances: { model: 'toaster', tint: 'var(--tint-appliances)', note: 'Small & mighty' },
  Bath: { model: 'duck', tint: 'var(--tint-bath)', note: 'Towels & mats' },
  Bedroom: { model: 'lamp', tint: 'var(--tint-bedroom)', note: 'Curtains & covers' },
  Accessories: { model: 'sunglasses', tint: 'var(--tint-accessories)', note: 'Shades & jewellery' },
  Sports: { model: 'kettlebell', tint: 'var(--tint-sports)', note: 'Kit for the court' },
  Home: { model: 'bag', tint: 'var(--tint-home)', note: 'Everything else' },
};

export const aisleFor = (name) => AISLES[name] ?? AISLES.Home;

/** The tint behind a product's photo, wherever it appears — grid, bag, checkout. */
export const tintFor = (product) => (product ? aisleFor(categoryOf(product)).tint : 'var(--img-bg)');
