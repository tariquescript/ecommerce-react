/**
 * The API only exposes free-form keywords, so the storefront rolls them up
 * into a small set of shelves.
 *
 * Matching order and display order are deliberately separate lists: an espresso
 * maker is tagged both "kitchen" and "espresso makers" and belongs under
 * Appliances, but Kitchen should still sit before Appliances in the filter bar.
 */

/** Most specific shelf first — the first match wins. */
const SHELVES = [
  ['Appliances', ['appliances', 'toaster', 'water kettle', 'espresso makers', 'food blenders']],
  ['Footwear', ['shoes', 'footwear', 'sneakers', 'heels', 'sandals', 'flats', 'running shoes']],
  ['Apparel', ['apparel', 'tshirts', 'sweaters', 'shirts', 'hoodies', 'pants', 'shorts', 'robe', 'swimsuit']],
  ['Bath', ['bathroom', 'washroom', 'restroom', 'towels', 'bath towels', 'bathmat', 'bathing']],
  ['Bedroom', ['bedroom', 'bed sheets', 'sheets', 'covers', 'curtains', 'shades']],
  ['Accessories', ['accessories', 'jewelry', 'sunglasses', 'glasses', 'hats', 'straw hats', 'winter hats', 'beanies', 'mirrors']],
  ['Sports', ['sports', 'basketballs', 'swimming', 'socks']],
  ['Kitchen', ['kitchen', 'cookware', 'dining', 'plates', 'bowls set', 'cooking set', 'food containers']],
];

/** The order shelves appear in the filter bar. */
const DISPLAY_ORDER = [
  'Apparel',
  'Footwear',
  'Kitchen',
  'Appliances',
  'Bath',
  'Bedroom',
  'Accessories',
  'Sports',
  'Home',
];

export const ALL = 'All';

/** Anything no shelf claims. */
const FALLBACK = 'Home';

export function categoryOf(product) {
  const keywords = product.keywords ?? [];
  const shelf = SHELVES.find(([, terms]) => keywords.some((k) => terms.includes(k)));
  return shelf ? shelf[0] : FALLBACK;
}

/** Only surfaces shelves that actually have stock behind them. */
export function buildCategories(products) {
  const present = new Set(products.map(categoryOf));
  return [ALL, ...DISPLAY_ORDER.filter((name) => present.has(name))];
}
