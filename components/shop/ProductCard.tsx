'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { money } from '@/lib/format';
import { useCart, useMisc } from '@/lib/store';

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [colorIdx, setColorIdx] = useState(0);
  const { add } = useCart();
  const { toggleWish, isWished, toast } = useMisc();
  const wished = isWished(product.id);
  const active = product.colors[colorIdx] ?? product.colors[0];
  const onSale = Boolean(product.compareAt && product.compareAt > product.price);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index, 7) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative aspect-[4/5]">
            {active && (
              <Image
                src={active.image}
                alt={`${product.name} in ${active.name}`}
                fill
                loading={index < 4 ? 'eager' : 'lazy'}
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                className="object-contain p-5 transition-transform duration-700 ease-silk group-hover:scale-[1.05]"
              />
            )}
          </div>
        </Link>

        {(product.badge || onSale) && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide2 ${
              onSale ? 'bg-sale text-white' : 'bg-ink text-paper'
            }`}
          >
            {onSale ? `−${Math.round(((product.compareAt! - product.price) / product.compareAt!) * 100)}%` : product.badge}
          </span>
        )}

        <button
          aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
          onClick={() => {
            toggleWish(product.id);
            toast(wished ? 'Removed from wishlist' : 'Saved to wishlist');
          }}
          className="absolute right-2.5 top-2.5 rounded-full bg-paper/80 p-2 text-ink-muted backdrop-blur transition-colors hover:text-ink"
        >
          <Heart size={15} className={wished ? 'fill-clay text-clay' : ''} />
        </button>

        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-300 ease-silk group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
          <button
            onClick={() => {
              add(product, { color: active?.name });
              toast(`${product.name} added to bag`);
            }}
            className="w-full rounded-full bg-ink py-2.5 text-[12px] font-medium text-paper transition-colors hover:bg-forest"
          >
            Quick add
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/product/${product.slug}`} className="block truncate text-[14px] font-medium hover:underline">
            {product.name}
          </Link>
          <p className="mt-0.5 text-[12px] text-ink-muted">{product.subcategory}</p>
          <p className="mt-1.5 flex items-baseline gap-2 text-[14px]">
            <span className={onSale ? 'text-sale' : ''}>{money(product.price)}</span>
            {onSale && <span className="text-[12px] text-ink-muted line-through">{money(product.compareAt!)}</span>}
          </p>
        </div>

        <div className="flex shrink-0 gap-1.5 pt-1">
          {product.colors.slice(0, 4).map((c, i) => (
            <button
              key={c.name}
              aria-label={c.name}
              title={c.name}
              onMouseEnter={() => setColorIdx(i)}
              onClick={() => setColorIdx(i)}
              className={`h-3.5 w-3.5 rounded-full border transition-transform ${
                i === colorIdx ? 'scale-110 border-ink' : 'border-line-strong'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>
    </motion.article>
  );
}
