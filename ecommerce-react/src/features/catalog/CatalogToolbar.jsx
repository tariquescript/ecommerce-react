import { Icon } from '../../components/ui/Icon.jsx';

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
];

export function CatalogToolbar({
  query,
  onQueryChange,
  categories,
  activeCategory,
  onCategoryChange,
  sort,
  onSortChange,
  resultCount,
  total,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <div className="search">
          <Icon name="search" size={17} className="search__icon" />
          <input
            className="search__input"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search the collection"
            aria-label="Search products"
            enterKeyHint="search"
          />
          {query && (
            <button className="search__clear" onClick={() => onQueryChange('')} aria-label="Clear search">
              <Icon name="close" size={14} strokeWidth={2} />
            </button>
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
          <Icon name="chevronDown" size={15} className="sort__chevron" />
        </label>
      </div>

      <div className="toolbar__row toolbar__row--filters">
        <div className="chips" role="group" aria-label="Filter by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip ${activeCategory === category ? 'is-active' : ''}`}
              aria-pressed={activeCategory === category}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <p className="toolbar__count tnum" aria-live="polite">
          {resultCount === total ? `${total} items` : `${resultCount} of ${total}`}
        </p>
      </div>
    </div>
  );
}
