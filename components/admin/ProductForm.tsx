'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCatalog, useMisc } from '@/lib/store';
import type { Category, ColorOption, Gender, Product } from '@/lib/types';

const IMAGE_LIBRARY = [
  'hoodie-sand', 'hoodie-charcoal', 'hoodie-sage', 'hoodie-rose', 'hoodie-ivory', 'hoodie-navy',
  'hoodie-clay', 'jacket-ink', 'jacket-olive', 'jacket-espresso', 'shirt-cobalt', 'shirt-white',
  'shirt-sand', 'shirt-emerald', 'dress-orchid', 'dress-emerald', 'dress-noir', 'dress-crimson',
  'sneaker-chalk', 'sneaker-onyx', 'sneaker-mint', 'watch-steel', 'watch-gold', 'watch-gunmetal',
].map((n) => `/products/${n}.png`);

const SIZE_PRESETS: Record<string, string[]> = {
  Apparel: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  Footwear: ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
  'One size': ['One size'],
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const BLANK: Omit<Product, 'id' | 'createdAt'> = {
  slug: '',
  name: '',
  brand: 'Atlas & Oak',
  category: 'clothing',
  subcategory: 'Hoodies',
  gender: 'unisex',
  price: 0,
  description: '',
  details: [],
  material: '',
  care: '',
  colors: [{ name: 'Sand', hex: '#e4d3b8', image: '/products/hoodie-sand.png' }],
  sizes: SIZE_PRESETS.Apparel,
  stock: 20,
  rating: 4.5,
  reviewCount: 0,
  tags: [],
};

export default function ProductForm({ existing }: { existing?: Product }) {
  const { create, update } = useCatalog();
  const { toast } = useMisc();
  const router = useRouter();

  const [form, setForm] = useState<Omit<Product, 'id' | 'createdAt'>>(() =>
    existing ? { ...existing } : { ...BLANK }
  );
  const [detailsText, setDetailsText] = useState(form.details.join('\n'));
  const [tagsText, setTagsText] = useState(form.tags.join(', '));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k as string]: '' }));
  };

  const setColor = (i: number, patch: Partial<ColorOption>) =>
    setForm((f) => ({ ...f, colors: f.colors.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 3) next.name = 'Give the product a name';
    if (!form.price || form.price <= 0) next.price = 'Set a price above zero';
    if (form.description.trim().length < 10) next.description = 'Write at least a sentence';
    if (form.colors.length === 0) next.colors = 'Add at least one colourway';
    if (form.compareAt && form.compareAt <= form.price) next.compareAt = 'Compare-at must be higher than the price';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      ...form,
      slug: slugify(form.name),
      details: detailsText.split('\n').map((d) => d.trim()).filter(Boolean),
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      compareAt: form.compareAt || undefined,
    };

    if (existing) {
      update(existing.id, payload);
      toast('Product updated');
    } else {
      create({
        ...payload,
        id: `p-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      });
      toast('Product created');
    }
    router.push('/admin/products');
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="card p-6">
          <h2 className="text-[15px] font-medium">Basics</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Product name" value={form.name} onChange={(v) => set('name', v)} error={errors.name} className="sm:col-span-2" />
            <Field label="Brand" value={form.brand} onChange={(v) => set('brand', v)} />
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select id="category" value={form.category} onChange={(e) => set('category', e.target.value as Category)} className="field">
                <option value="clothing">Clothing</option>
                <option value="footwear">Footwear</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
            <Field label="Type (e.g. Hoodies)" value={form.subcategory} onChange={(v) => set('subcategory', v)} />
            <div>
              <label className="label" htmlFor="gender">Collection</label>
              <select id="gender" value={form.gender} onChange={(e) => set('gender', e.target.value as Gender)} className="field">
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="description">Description</label>
              <textarea id="description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} className={`field resize-y ${errors.description ? 'border-sale' : ''}`} />
              {errors.description && <p className="mt-1.5 text-[12px] text-sale">{errors.description}</p>}
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-[15px] font-medium">Colourways</h2>
          <p className="mt-1 text-[12.5px] text-ink-muted">Each colourway needs an image from the library.</p>

          <div className="mt-5 space-y-4">
            {form.colors.map((c, i) => (
              <div key={i} className="rounded-2xl border border-line p-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-paper">
                    {c.image && <Image src={c.image} alt={c.name} fill sizes="64px" className="object-contain p-1.5" />}
                  </div>
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <Field label="Colour name" value={c.name} onChange={(v) => setColor(i, { name: v })} />
                    <div>
                      <label className="label">Swatch</label>
                      <div className="flex gap-2">
                        <input type="color" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })} className="h-[46px] w-14 cursor-pointer rounded-xl border border-line bg-surface p-1" />
                        <input value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })} className="field font-mono text-[13px]" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Image</label>
                      <select value={c.image} onChange={(e) => setColor(i, { image: e.target.value })} className="field">
                        {IMAGE_LIBRARY.map((src) => (
                          <option key={src} value={src}>{src.split('/').pop()!.replace('.png', '')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {form.colors.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove colourway"
                      onClick={() => set('colors', form.colors.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-full p-2 text-ink-muted hover:bg-sale/5 hover:text-sale"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {errors.colors && <p className="mt-2 text-[12px] text-sale">{errors.colors}</p>}

          <button
            type="button"
            onClick={() => set('colors', [...form.colors, { name: 'New colour', hex: '#cccccc', image: IMAGE_LIBRARY[0] }])}
            className="btn-secondary btn-sm mt-4"
          >
            <Plus size={14} /> Add colourway
          </button>
        </section>

        <section className="card p-6">
          <h2 className="text-[15px] font-medium">Details</h2>
          <div className="mt-5 grid gap-4">
            <div>
              <label className="label" htmlFor="details">Bullet points (one per line)</label>
              <textarea id="details" rows={4} value={detailsText} onChange={(e) => setDetailsText(e.target.value)} className="field resize-y" />
            </div>
            <Field label="Material" value={form.material} onChange={(v) => set('material', v)} />
            <Field label="Care instructions" value={form.care} onChange={(v) => set('care', v)} />
            <Field label="Tags (comma separated)" value={tagsText} onChange={setTagsText} />
          </div>
        </section>
      </div>

      {/* side */}
      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="text-[15px] font-medium">Pricing</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Price (USD)" type="number" value={String(form.price)} onChange={(v) => set('price', Number(v))} error={errors.price} />
            <Field label="Compare at (optional)" type="number" value={String(form.compareAt ?? '')} onChange={(v) => set('compareAt', v ? Number(v) : undefined)} error={errors.compareAt} hint="Shows a strike-through sale price" />
            <Field label="Stock" type="number" value={String(form.stock)} onChange={(v) => set('stock', Number(v))} />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-[15px] font-medium">Sizes</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(SIZE_PRESETS).map(([label, sizes]) => (
              <button
                key={label}
                type="button"
                onClick={() => set('sizes', sizes)}
                className={`chip ${form.sizes.join() === sizes.join() ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-ink-muted">{form.sizes.join(' · ')}</p>
        </section>

        <section className="card p-6">
          <h2 className="text-[15px] font-medium">Merchandising</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Badge (optional)" value={form.badge ?? ''} onChange={(v) => set('badge', v || undefined)} hint="e.g. New, Bestseller" />
            <Field label="Rating" type="number" value={String(form.rating)} onChange={(v) => set('rating', Math.min(5, Math.max(0, Number(v))))} />
            <Field label="Review count" type="number" value={String(form.reviewCount)} onChange={(v) => set('reviewCount', Number(v))} />
            <label className="flex items-center gap-2.5 text-[13.5px]">
              <input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4 rounded border-line-strong accent-[#1f4634]" />
              Feature on the homepage
            </label>
          </div>
        </section>

        <div className="flex gap-2.5">
          <button type="submit" className="btn-primary flex-1">{existing ? 'Save changes' : 'Create product'}</button>
          <Link href="/admin/products" className="btn-secondary">Cancel</Link>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  hint,
  className = '',
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  const id = `f-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`field ${error ? 'border-sale' : ''}`} {...rest} />
      {error ? <p className="mt-1.5 text-[12px] text-sale">{error}</p> : hint ? <p className="mt-1.5 text-[12px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}
