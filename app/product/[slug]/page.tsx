'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, Heart, Minus, Plus, RotateCcw, Ruler, Truck } from 'lucide-react';
import { useCart, useCatalog, useMisc } from '@/lib/store';
import { money } from '@/lib/format';
import { sizeGuide } from '@/lib/seed';
import Rating from '@/components/ui/Rating';
import ProductCard from '@/components/shop/ProductCard';

const sampleReviews = [
  { name: 'Marta K.', rating: 5, title: 'Exactly as described', body: 'Fabric is far heavier than I expected — in the best way. Sized down and the fit is perfect.' },
  { name: 'Tom A.', rating: 5, title: 'Worth it', body: 'Third piece I have bought here. Nothing has pilled or lost shape.' },
  { name: 'Yuki S.', rating: 4, title: 'Great, runs big', body: 'Lovely colour and finish. Take one size down if you want it fitted.' },
];

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { bySlug, products, ready } = useCatalog();
  const { add } = useCart();
  const { toggleWish, isWished, toast } = useMisc();
  const router = useRouter();

  const product = bySlug(slug);
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [guide, setGuide] = useState(false);

  const related = useMemo(
    () =>
      product
        ? products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4)
        : [],
    [products, product]
  );

  if (!product) {
    return (
      <div className="shell flex flex-col items-center gap-4 py-28 text-center">
        <p className="font-display text-[26px]">{ready ? 'We cannot find that piece' : 'Loading…'}</p>
        {ready && (
          <>
            <p className="max-w-[380px] text-[14px] text-ink-muted">
              It may have been removed from the catalogue.
            </p>
            <Link href="/shop" className="btn-primary mt-2">Back to the shop</Link>
          </>
        )}
      </div>
    );
  }

  const color = product.colors[colorIdx] ?? product.colors[0];
  const onSale = Boolean(product.compareAt && product.compareAt > product.price);
  const wished = isWished(product.id);
  const needsSize = product.sizes.length > 1;
  const guideRows = product.category === 'footwear' ? sizeGuide.footwear : sizeGuide.clothing;

  const addToBag = (goToCheckout = false) => {
    if (needsSize && !size) {
      setSizeError(true);
      return;
    }
    add(product, { color: color.name, size: size ?? product.sizes[0], qty, silent: goToCheckout });
    if (goToCheckout) router.push('/checkout');
    else toast(`${product.name} added to bag`);
  };

  return (
    <div className="shell py-8">
      <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ChevronLeft size={15} /> Back
      </button>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* gallery */}
        <div>
          <motion.div
            key={color.image}
            initial={{ opacity: 0.4, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-surface"
          >
            <Image src={color.image} alt={`${product.name} in ${color.name}`} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-contain p-10" />
            {onSale && (
              <span className="absolute left-4 top-4 rounded-full bg-sale px-3 py-1 text-[11px] font-medium text-white">
                Save {money(product.compareAt! - product.price)}
              </span>
            )}
          </motion.div>

          {product.colors.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setColorIdx(i)}
                  className={`relative aspect-square overflow-hidden rounded-2xl border bg-surface transition-colors ${
                    i === colorIdx ? 'border-ink' : 'border-line hover:border-line-strong'
                  }`}
                >
                  <Image src={c.image} alt={c.name} fill sizes="120px" className="object-contain p-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* buy box */}
        <div>
          <p className="eyebrow">{product.brand} · {product.subcategory}</p>
          <h1 className="mt-2.5 font-display text-[clamp(1.8rem,3.6vw,2.5rem)] font-semibold leading-tight tracking-tight">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-4">
            <Rating value={product.rating} count={product.reviewCount} />
            <span className="text-[12px] text-ink-muted">
              {product.stock > 10 ? 'In stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of stock'}
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className={`text-[26px] font-medium ${onSale ? 'text-sale' : ''}`}>{money(product.price)}</span>
            {onSale && <span className="text-[16px] text-ink-muted line-through">{money(product.compareAt!)}</span>}
          </div>

          <p className="mt-5 max-w-[520px] text-[14.5px] leading-relaxed text-ink-muted">{product.description}</p>

          {/* colour */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <p className="label">Colour</p>
              <p className="text-[13px] text-ink-muted">{color.name}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2.5">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  aria-label={c.name}
                  onClick={() => setColorIdx(i)}
                  className={`h-9 w-9 rounded-full border-2 transition-transform ${
                    i === colorIdx ? 'scale-105 border-ink' : 'border-line hover:border-line-strong'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* size */}
          {needsSize && (
            <div className="mt-7">
              <div className="flex items-baseline justify-between">
                <p className="label">Size</p>
                <button onClick={() => setGuide((g) => !g)} className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted underline underline-offset-2 hover:text-ink">
                  <Ruler size={13} /> Size guide
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setSizeError(false);
                    }}
                    className={`min-w-[60px] rounded-xl border px-4 py-2.5 text-[13px] transition-colors ${
                      size === s ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {sizeError && <p className="mt-2 text-[12px] text-sale">Choose a size first.</p>}

              {guide && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-line">
                  <table className="w-full text-[12.5px]">
                    <tbody>
                      {guideRows.map((r, i) => (
                        <tr key={r.size} className={i % 2 ? 'bg-paper' : 'bg-surface'}>
                          <td className="px-4 py-2 font-medium">{r.size}</td>
                          {Object.entries(r)
                            .filter(([k]) => k !== 'size')
                            .map(([k, v]) => (
                              <td key={k} className="px-4 py-2 text-ink-muted">{v}</td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* qty + actions */}
          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center gap-4 rounded-full border border-line px-4 py-2.5">
              <button aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="text-ink-muted hover:text-ink">
                <Minus size={15} />
              </button>
              <span className="min-w-[18px] text-center text-[14px] tabular-nums">{qty}</span>
              <button aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(10, q + 1))} className="text-ink-muted hover:text-ink">
                <Plus size={15} />
              </button>
            </div>
            <button
              onClick={() => {
                toggleWish(product.id);
                toast(wished ? 'Removed from wishlist' : 'Saved to wishlist');
              }}
              aria-label="Save to wishlist"
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-line transition-colors hover:border-ink"
            >
              <Heart size={17} className={wished ? 'fill-clay text-clay' : ''} />
            </button>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <button onClick={() => addToBag(false)} disabled={product.stock === 0} className="btn-primary w-full">
              Add to bag · {money(product.price * qty)}
            </button>
            <button onClick={() => addToBag(true)} disabled={product.stock === 0} className="btn-secondary w-full">
              Buy it now
            </button>
          </div>

          <ul className="mt-7 space-y-2.5 border-t border-line pt-6 text-[13px] text-ink-muted">
            <li className="flex items-center gap-2.5"><Truck size={15} className="text-forest" /> Free standard shipping, 4–6 business days</li>
            <li className="flex items-center gap-2.5"><RotateCcw size={15} className="text-forest" /> Free returns and exchanges for 30 days</li>
            <li className="flex items-center gap-2.5"><Check size={15} className="text-forest" /> {product.material}</li>
          </ul>

          <div className="mt-8 space-y-4 border-t border-line pt-6">
            <Accordion title="Details">
              <ul className="space-y-1.5">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-2"><span className="text-ink-muted">—</span>{d}</li>
                ))}
              </ul>
            </Accordion>
            <Accordion title="Material & care">
              <p>{product.material}</p>
              <p className="mt-1.5">{product.care}</p>
            </Accordion>
            <Accordion title={`Reviews (${product.reviewCount})`}>
              <div className="space-y-4">
                {sampleReviews.map((r) => (
                  <div key={r.name}>
                    <Rating value={r.rating} size={12} />
                    <p className="mt-1.5 text-[13.5px] font-medium text-ink">{r.title}</p>
                    <p className="mt-1 text-[13px]">{r.body}</p>
                    <p className="mt-1.5 text-[12px] text-ink-muted">{r.name} · verified buyer</p>
                  </div>
                ))}
              </div>
            </Accordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-12">
          <h2 className="font-display text-[24px] font-semibold tracking-tight">You might also like</h2>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line pb-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-1 text-left text-[14px] font-medium">
        {title}
        <Plus size={16} className={`text-ink-muted transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
      </button>
      {open && <div className="pt-3 text-[13.5px] leading-relaxed text-ink-muted">{children}</div>}
    </div>
  );
}
