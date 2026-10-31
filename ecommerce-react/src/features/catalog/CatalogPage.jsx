import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { Hero } from './Hero.jsx';
import { Promises } from './Promises.jsx';
import { CatalogToolbar } from './CatalogToolbar.jsx';
import { ProductCard } from './ProductCard.jsx';
import { ALL, buildCategories, categoryOf, countByCategory } from './categories.js';
import { ProductCardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ModelSlot } from '../../components/three/ModelSlot.jsx';
import { useResource } from '../../lib/hooks/index.js';
import { morph } from '../../lib/morph.js';
import { useCartState } from '../cart/cart-context.js';
import './catalog.css';

const SORTERS = {
  featured: null,
  'price-asc': (a, b) => a.priceCents - b.priceCents,
  'price-desc': (a, b) => b.priceCents - a.priceCents,
  rating: (a, b) => b.rating.stars - a.rating.stars || b.rating.count - a.rating.count,
};

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export function CatalogPage() {
  const { data: products, isLoading, error, refresh } = useResource('/api/products');
  const { items, pending } = useCartState();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState('featured');
  const gridRef = useRef(null);

  // Keeps typing responsive: the input updates immediately, the 42-card grid
  // re-filters at a lower priority instead of blocking each keystroke.
  const deferredQuery = useDeferredValue(query);
  // `products ?? []` would be a new array identity on every render while the
  // request is in flight, invalidating every memo below.
  const list = useMemo(() => products ?? [], [products]);

  const categories = useMemo(() => buildCategories(list), [list]);
  const counts = useMemo(() => countByCategory(list), [list]);
  const aisles = useMemo(() => categories.filter((c) => c !== ALL), [categories]);
  /** Catalogue numbers follow the API's order, so a product keeps its Nº under any sort. */
  const numbers = useMemo(() => new Map(list.map((p, i) => [p.id, i + 1])), [list]);
  /** Cards get their own quantity as a plain number, so memo() can skip the others. */
  const quantities = useMemo(
    () => new Map(items.map((item) => [item.productId, item.quantity])),
    [items]
  );

  const visible = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    let result = list;

    if (category !== ALL) {
      result = result.filter((p) => categoryOf(p) === category);
    }
    if (term) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.keywords?.some((k) => k.toLowerCase().includes(term))
      );
    }

    const sorter = SORTERS[sort];
    return sorter ? [...result].sort(sorter) : result;
  }, [list, deferredQuery, category, sort]);

  // Tabs and sort animate the grid in place; the hero shelf jumps down to it.
  const changeCategory = (next) => morph(gridRef.current, () => setCategory(next));
  const changeSort = (next) => morph(gridRef.current, () => setSort(next));

  function pickAisle(name) {
    setQuery('');
    setCategory(name);
    scrollToId('catalogue');
  }

  function clearFilters() {
    morph(gridRef.current, () => {
      setQuery('');
      setCategory(ALL);
    });
  }

  return (
    <>
      <Hero
        aisles={aisles}
        counts={counts}
        total={list.length}
        onPickAisle={pickAisle}
        onBrowse={() => scrollToId('catalogue')}
        onShipping={() => scrollToId('promises')}
      />

      <Promises />

      <section className="catalog page" id="catalogue" aria-labelledby="catalog-heading">
        <header className="catalog__header">
          <div>
            <p className="eyebrow">The catalogue</p>
            <h2 id="catalog-heading" className="section-title">
              Everything in stock.
            </h2>
            <p className="section-sub">
              {list.length} objects across {aisles.length} aisles — nothing on back-order.
            </p>
          </div>
          <ModelSlot model="bag" className="catalog__model" />
        </header>

        <CatalogToolbar
          query={query}
          onQueryChange={setQuery}
          categories={categories}
          counts={counts}
          total={list.length}
          activeCategory={category}
          onCategoryChange={changeCategory}
          sort={sort}
          onSortChange={changeSort}
          resultCount={visible.length}
        />

        {error && !list.length ? (
          <div className="empty">
            <h3 className="empty__title">The catalogue could not be reached</h3>
            <p className="empty__body">{error.message}</p>
            <Button variant="secondary" onClick={refresh}>
              <Icon name="refresh" size={16} />
              Try again
            </Button>
          </div>
        ) : (
          <div className="product-grid" ref={gridRef}>
            {isLoading && !list.length
              ? Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)
              : visible.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    number={numbers.get(product.id)}
                    aisle={categoryOf(product)}
                    quantity={quantities.get(product.id) ?? 0}
                    busy={pending.has(product.id)}
                    index={index}
                    priority={index < 4}
                  />
                ))}
          </div>
        )}

        {!isLoading && list.length > 0 && visible.length === 0 && (
          <div className="empty">
            <h3 className="empty__title">Nothing on this shelf</h3>
            <p className="empty__body">
              Try a different search, or clear the filters to see all {list.length} objects.
            </p>
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
