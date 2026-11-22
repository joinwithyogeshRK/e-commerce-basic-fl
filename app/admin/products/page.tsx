'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useCatalog, useMisc } from '@/lib/store';
import { money } from '@/lib/format';

export default function AdminProducts() {
  const { products, remove, resetToSeed } = useCatalog();
  const { toast } = useMisc();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      products.filter((p) => {
        if (category && p.category !== category) return false;
        if (!query) return true;
        return `${p.name} ${p.subcategory} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase());
      }),
    [products, query, category]
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] font-semibold tracking-tight">Products</h1>
          <p className="mt-2 text-[13px] text-ink-muted">{products.length} in the catalogue</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              resetToSeed();
              toast('Catalogue reset to the original 22 products');
            }}
            className="btn-secondary btn-sm"
          >
            <RotateCcw size={14} /> Reset catalogue
          </button>
          <Link href="/admin/products/new" className="btn-primary btn-sm">
            <Plus size={14} /> Add product
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5">
          <Search size={15} className="text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-transparent text-[13.5px] outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {[['', 'All'], ['clothing', 'Clothing'], ['footwear', 'Footwear'], ['accessories', 'Accessories']].map(([v, l]) => (
            <button key={l} onClick={() => setCategory(v)} className={`chip ${category === v ? 'chip-active' : ''}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13.5px]">
          <thead>
            <tr className="border-b border-line text-left text-[12px] text-ink-muted">
              <th className="px-5 py-3.5 font-medium">Product</th>
              <th className="px-5 py-3.5 font-medium">Category</th>
              <th className="px-5 py-3.5 font-medium">Colours</th>
              <th className="px-5 py-3.5 font-medium">Stock</th>
              <th className="px-5 py-3.5 text-right font-medium">Price</th>
              <th className="px-5 py-3.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-paper/60">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-paper">
                      <Image src={p.colors[0]?.image ?? ''} alt={p.name} fill sizes="40px" className="object-contain p-1" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/product/${p.slug}`} className="block truncate font-medium hover:underline">{p.name}</Link>
                      <p className="truncate text-[12px] text-ink-muted">{p.subcategory} · {p.gender}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 capitalize text-ink-muted">{p.category}</td>
                <td className="px-5 py-4">
                  <span className="flex gap-1">
                    {p.colors.map((c) => (
                      <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full border border-line-strong" style={{ backgroundColor: c.hex }} />
                    ))}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={p.stock === 0 ? 'text-sale' : p.stock < 20 ? 'text-clay' : 'text-ink-muted'}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {money(p.price)}
                  {p.compareAt && <span className="ml-2 text-[12px] text-ink-muted line-through">{money(p.compareAt)}</span>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} className="rounded-full p-2 text-ink-muted hover:bg-ink/5 hover:text-ink">
                      <Pencil size={15} />
                    </Link>
                    <button
                      aria-label={`Delete ${p.name}`}
                      onClick={() => setConfirm(p.id)}
                      className="rounded-full p-2 text-ink-muted hover:bg-sale/5 hover:text-sale"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="px-5 py-12 text-center text-[13.5px] text-ink-muted">No products match that search.</p>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setConfirm(null)} />
          <div className="card relative w-full max-w-[400px] p-6">
            <h2 className="text-[17px] font-medium">Delete this product?</h2>
            <p className="mt-2 text-[13.5px] text-ink-muted">
              {products.find((p) => p.id === confirm)?.name} will be removed from the storefront.
              You can restore the original catalogue at any time.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => {
                  const name = products.find((p) => p.id === confirm)?.name;
                  remove(confirm);
                  setConfirm(null);
                  toast(`${name} deleted`);
                }}
                className="btn flex-1 bg-sale text-white hover:bg-sale/90"
              >
                Delete
              </button>
              <button onClick={() => setConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
