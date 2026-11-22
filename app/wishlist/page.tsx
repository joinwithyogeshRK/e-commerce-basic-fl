'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useCatalog, useMisc } from '@/lib/store';
import ProductCard from '@/components/shop/ProductCard';

export default function WishlistPage() {
  const { wishlist } = useMisc();
  const { products } = useCatalog();
  const saved = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="shell py-10">
      <p className="eyebrow">Saved</p>
      <h1 className="mt-2 font-display text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight">Wishlist</h1>

      {saved.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-5 py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
            <Heart size={24} className="text-ink-muted" />
          </span>
          <p className="font-display text-[24px] font-semibold">Nothing saved yet</p>
          <p className="max-w-[380px] text-[14px] text-ink-muted">
            Tap the heart on any piece and it will wait for you here.
          </p>
          <Link href="/shop" className="btn-primary mt-1">Browse the shop</Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-[13px] text-ink-muted">{saved.length} saved</p>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {saved.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
