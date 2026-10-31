import { useEffect, useLayoutEffect, useRef } from 'react';
import { Icon } from '../../components/ui/Icon.jsx';
import { ALL } from './categories.js';

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
];

/**
 * Search, sort and the aisle tabs.
 *
 * The active-aisle pill is one element that glides between tabs. Its geometry
 * is written to CSS variables straight from layout reads — no state, no
 * re-render — and re-measured by a ResizeObserver, so a late web font or a
 * resized window never leaves it misaligned.
 */
export function CatalogToolbar({
  query,
  onQueryChange,
  categories,
  counts,
  total,
  activeCategory,
  onCategoryChange,
  sort,
  onSortChange,
  resultCount,
}) {
  const tabsRef = useRef(null);
  const pillRef = useRef(null);
  const searchRef = useRef(null);

  useLayoutEffect(() => {
    const tabs = tabsRef.current;
    const pill = pillRef.current;
    if (!tabs || !pill) return undefined;

    const place = () => {
      const active = tabs.querySelector('[aria-pressed="true"]');
      if (!active) return;
      pill.style.setProperty('--x', `${active.offsetLeft}px`);
      pill.style.setProperty('--w', `${active.offsetWidth}px`);
      pill.dataset.ready = 'true';
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(tabs);
    return () => observer.disconnect();
  }, [activeCategory, categories]);

  // Keep the active tab in view when the row scrolls sideways on phones.
  useEffect(() => {
    const active = tabsRef.current?.querySelector('[aria-pressed="true"]');
    const row = tabsRef.current;
    if (!active || !row || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: active.offsetLeft - row.clientWidth / 2 + active.offsetWidth / 2, behavior: 'smooth' });
  }, [activeCategory]);

  // "/" jumps to search from anywhere on the page, as on most big catalogues.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <div className="search">
          <Icon name="search" size={18} className="search__icon" />
          <input
            ref={searchRef}
            className="search__input"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Search ${total} objects`}
            aria-label="Search products"
            enterKeyHint="search"
            aria-keyshortcuts="/"
          />
          {query ? (
            <button className="search__clear" onClick={() => onQueryChange('')} aria-label="Clear search">
              <Icon name="close" size={14} strokeWidth={2} />
            </button>
          ) : (
            <kbd className="search__kbd" aria-hidden="true">/</kbd>
          )}
        </div>

        <label className="sort">
          <span className="visually-hidden">Sort products</span>
          <select className="sort__select" value={sort} onChange={(e) => onSortChange(e.target.value)}>
            {SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" size={16} className="sort__chevron" />
        </label>
      </div>

      <div className="toolbar__row toolbar__row--aisles">
        <div className="aisle-tabs" ref={tabsRef} role="group" aria-label="Filter by aisle">
          <span className="aisle-tabs__pill" ref={pillRef} aria-hidden="true" />
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="aisle-tab"
              aria-pressed={activeCategory === category}
              onClick={() => onCategoryChange(category)}
            >
              {category}
              <span className="aisle-tab__count tnum">
                {category === ALL ? total : counts[category] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <p className="toolbar__count tnum" aria-live="polite">
          {resultCount === total ? `${total} objects` : `${resultCount} of ${total}`}
        </p>
      </div>
    </div>
  );
}
