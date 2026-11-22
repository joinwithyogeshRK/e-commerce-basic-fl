'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { useCatalog } from '@/lib/store';
import ProductCard from '@/components/shop/ProductCard';
import { money } from '@/lib/format';
import type { Category, Product } from '@/lib/types';

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'newest', label: 'Newest' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'rating', label: 'Top rated' },
];

const CATEGORY_LABELS: Record<Category, string> = {
  clothing: 'Clothing',
  footwear: 'Footwear',
  accessories: 'Accessories',
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="shell py-20 text-[14px] text-ink-muted">Loading the shop…</div>}>
      <Shop />
    </Suspense>
  );
}

function Shop() {
  const { products } = useCatalog();
  const params = useSearchParams();
  const router = useRouter();
  const [panel, setPanel] = useState(false);

  const query = params.get('q')?.toLowerCase() ?? '';
  const category = params.get('category') ?? '';
  const sub = params.get('sub') ?? '';
  const gender = params.get('gender') ?? '';
  const saleOnly = params.get('sale') === '1';
  const maxPrice = Number(params.get('max') ?? 0);
  const sort = params.get('sort') ?? 'featured';

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/shop?${next.toString()}`, { scroll: false });
  };

  const subcategories = useMemo(() => {
    const pool = category ? products.filter((p) => p.category === category) : products;
    return Array.from(new Set(pool.map((p) => p.subcategory))).sort();
  }, [products, category]);

  const results = useMemo(() => {
    let list = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (sub && p.subcategory !== sub) return false;
      if (gender && p.gender !== gender && p.gender !== 'unisex') return false;
      if (saleOnly && !p.compareAt) return false;
      if (maxPrice && p.price > maxPrice) return false;
      if (query) {
        const haystack = `${p.name} ${p.subcategory} ${p.category} ${p.tags.join(' ')} ${p.colors
          .map((c) => c.name)
          .join(' ')} ${p.material}`.toLowerCase();
        if (!query.split(/\s+/).every((w) => haystack.includes(w))) return false;
      }
      return true;
    });

    list = [...list];
    switch (sort) {
      case 'newest':
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.rating - a.rating);
    }
    return list;
  }, [products, category, sub, gender, saleOnly, maxPrice, query, sort]);

  const activeFilters = [
    category && { key: 'category', label: CATEGORY_LABELS[category as Category] ?? category },
    sub && { key: 'sub', label: sub },
    gender && { key: 'gender', label: gender === 'men' ? 'Men' : 'Women' },
    saleOnly && { key: 'sale', label: 'On sale' },
    maxPrice ? { key: 'max', label: `Under ${money(maxPrice)}` } : null,
    query && { key: 'q', label: `“${query}”` },
  ].filter(Boolean) as { key: string; label: string }[];

  const filters = (
    <div className="space-y-7">
      <FilterGroup title="Category">
        <Option label="Everything" active={!category} onClick={() => { setParam('category', null); setParam('sub', null); }} />
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <Option key={c} label={CATEGORY_LABELS[c]} active={category === c} onClick={() => setParam('category', c)} />
        ))}
      </FilterGroup>

      <FilterGroup title="Type">
        <Option label="All types" active={!sub} onClick={() => setParam('sub', null)} />
        {subcategories.map((s) => (
          <Option key={s} label={s} active={sub === s} onClick={() => setParam('sub', s)} />
        ))}
      </FilterGroup>

      <FilterGroup title="Collection">
        <Option label="Everyone" active={!gender} onClick={() => setParam('gender', null)} />
        <Option label="Men" active={gender === 'men'} onClick={() => setParam('gender', 'men')} />
        <Option label="Women" active={gender === 'women'} onClick={() => setParam('gender', 'women')} />
      </FilterGroup>

      <FilterGroup title="Price">
        {[100, 150, 250, 400].map((v) => (
          <Option key={v} label={`Under ${money(v)}`} active={maxPrice === v} onClick={() => setParam('max', maxPrice === v ? null : String(v))} />
        ))}
      </FilterGroup>

      <FilterGroup title="Offers">
        <Option label="On sale only" active={saleOnly} onClick={() => setParam('sale', saleOnly ? null : '1')} />
      </FilterGroup>
    </div>
  );

  return (
    <div className="shell py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Shop</p>
          <h1 className="mt-2 font-display text-[clamp(1.9rem,4vw,2.8rem)] font-semibold tracking-tight">
            {query ? `Results for “${query}”` : category ? CATEGORY_LABELS[category as Category] : 'Everything'}
          </h1>
          <p className="mt-2 text-[13px] text-ink-muted">
            {results.length} piece{results.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPanel(true)} className="btn-secondary btn-sm lg:hidden">
            <SlidersHorizontal size={14} /> Filters
          </button>
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="rounded-full border border-line bg-surface px-4 py-2 text-[13px] outline-none focus:border-forest"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </header>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-4">
          {activeFilters.map((f) => (
            <button key={f.key} onClick={() => setParam(f.key, null)} className="chip chip-active">
              {f.label} <X size={12} />
            </button>
          ))}
          <button onClick={() => router.push('/shop')} className="text-[12px] text-ink-muted underline underline-offset-2 hover:text-ink">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-10 pt-6">
        <aside className="hidden w-[210px] shrink-0 lg:block">{filters}</aside>

        <div className="min-w-0 flex-1">
          {results.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
              <p className="font-display text-[22px]">Nothing matches those filters</p>
              <p className="max-w-[360px] text-[13.5px] text-ink-muted">
                Try widening the price range or clearing a filter. Ora can help too — ask for
                something like &ldquo;hoodies under $150&rdquo;.
              </p>
              <button onClick={() => router.push('/shop')} className="btn-primary mt-2">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
              {results.map((p: Product, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {panel && (
        <div className="fixed inset-0 z-[75] lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setPanel(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[330px] overflow-y-auto bg-paper p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[15px] font-medium">Filters</span>
              <button aria-label="Close filters" onClick={() => setPanel(false)} className="rounded-full p-2 hover:bg-ink/5">
                <X size={17} />
              </button>
            </div>
            {filters}
            <button onClick={() => setPanel(false)} className="btn-primary mt-8 w-full">
              Show {results.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Option({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left text-[13.5px] transition-colors ${
        active ? 'font-medium text-ink' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {active && <span className="mr-1.5">—</span>}
      {label}
    </button>
  );
}
