import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { Hero } from './Hero.jsx';
import { CatalogToolbar } from './CatalogToolbar.jsx';
import { ProductCard } from './ProductCard.jsx';
import { ALL, buildCategories, categoryOf } from './categories.js';
import { ProductCardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { useResource } from '../../lib/hooks/index.js';
import './catalog.css';
import { Button } from '../../components/ui/Button.jsx';

const ASSURANCES = [
  { icon: 'truck', title: 'Two-day priority', body: 'Free above $40, tracked end to end, no signature games.' },
  { icon: 'refresh', title: '60-day returns', body: 'Changed your mind? Send it back. We pay the postage.' },
  { icon: 'shield', title: 'Two-year cover', body: 'Every appliance and piece of kit, repaired or replaced.' },
];

const SORTERS = {
  featured: null,
  'price-asc': (a, b) => a.priceCents - b.priceCents,
  'price-desc': (a, b) => b.priceCents - a.priceCents,
  rating: (a, b) => b.rating.stars - a.rating.stars || b.rating.count - a.rating.count,
};

export function CatalogPage() {
  const { data: products, isLoading, error, refresh } = useResource('/api/products');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState('featured');
  const gridRef = useRef(null);

  // Keeps typing responsive: the input updates immediately, the 42-card grid
  // re-filters at a lower priority instead of blocking each keystroke.
  const deferredQuery = useDeferredValue(query);
  // `products ?? []` would be a new array identity on every render while the
  // request is in flight, invalidating both memos below.
  const list = useMemo(() => products ?? [], [products]);

  const categories = useMemo(() => buildCategories(list), [list]);

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

  const scrollToGrid = () =>
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <Hero onBrowse={scrollToGrid} />

      <section className="assurances page" id="assurances">
        {ASSURANCES.map((item) => (
          <div key={item.title} className="assurance">
            <span className="assurance__icon">
              <Icon name={item.icon} size={19} />
            </span>
            <div>
              <h3 className="assurance__title">{item.title}</h3>
              <p className="assurance__body">{item.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="catalog page" ref={gridRef} aria-labelledby="catalog-heading">
        <header className="catalog__header">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 id="catalog-heading" className="catalog__title">
              Everything in stock
            </h2>
          </div>
        </header>

        <CatalogToolbar
          query={query}
          onQueryChange={setQuery}
          categories={categories}
          activeCategory={category}
          onCategoryChange={setCategory}
          sort={sort}
          onSortChange={setSort}
          resultCount={visible.length}
          total={list.length}
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
          <div className="product-grid">
            {isLoading && !list.length
              ? Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)
              : visible.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    priority={index < 4}
                  />
                ))}
          </div>
        )}

        {!isLoading && list.length > 0 && visible.length === 0 && (
          <div className="empty">
            <h3 className="empty__title">Nothing matches that</h3>
            <p className="empty__body">
              Try a different search, or clear the filters to see all {list.length} pieces.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('');
                setCategory(ALL);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
