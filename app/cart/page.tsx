'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Tag, X } from 'lucide-react';
import { useCart } from '@/lib/store';
import { money } from '@/lib/format';
import { coupons } from '@/lib/seed';

export default function CartPage() {
  const { lines, setQty, remove, subtotal, totals, coupon, couponError, applyCoupon, clearCoupon, count } = useCart();
  const [code, setCode] = useState('');
  const t = totals(0);

  if (lines.length === 0) {
    return (
      <div className="shell flex flex-col items-center gap-5 py-28 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
          <ShoppingBag size={24} className="text-ink-muted" />
        </span>
        <h1 className="font-display text-[30px] font-semibold">Your bag is empty</h1>
        <p className="max-w-[400px] text-[14px] text-ink-muted">
          Nothing in here yet. Browse the collection, or ask Ora for something specific — she can
          add it to your bag for you.
        </p>
        <Link href="/shop" className="btn-primary mt-2">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="shell py-10">
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight">
        Your bag <span className="text-ink-muted">({count})</span>
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-5 py-6">
                <Link href={`/product/${l.slug}`} className="relative h-[130px] w-[110px] shrink-0 overflow-hidden rounded-2xl border border-line bg-surface">
                  <Image src={l.image} alt={l.name} fill sizes="110px" className="object-contain p-3" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/product/${l.slug}`} className="text-[15px] font-medium hover:underline">
                        {l.name}
                      </Link>
                      <p className="mt-1 text-[13px] text-ink-muted">
                        {l.color} · Size {l.size}
                      </p>
                      <p className="mt-1 text-[13px] text-ink-muted">{money(l.price)} each</p>
                    </div>
                    <button aria-label={`Remove ${l.name}`} onClick={() => remove(l.key)} className="rounded-full p-1.5 text-ink-muted hover:bg-ink/5 hover:text-ink">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 rounded-full border border-line px-3.5 py-2">
                      <button aria-label="Decrease" onClick={() => setQty(l.key, l.qty - 1)} className="text-ink-muted hover:text-ink">
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[16px] text-center text-[13px] tabular-nums">{l.qty}</span>
                      <button aria-label="Increase" onClick={() => setQty(l.key, l.qty + 1)} className="text-ink-muted hover:text-ink">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-[15px] font-medium">{money(l.price * l.qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link href="/shop" className="mt-6 inline-block text-[13.5px] text-ink-muted underline underline-offset-2 hover:text-ink">
            Continue shopping
          </Link>
        </div>

        {/* summary */}
        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="card sticky top-28 p-6">
            <h2 className="text-[16px] font-medium">Order summary</h2>

            <div className="mt-5 space-y-2.5 text-[13.5px]">
              <Row label="Subtotal" value={money(t.subtotal)} />
              {t.discount > 0 && <Row label={`Discount (${coupon})`} value={`−${money(t.discount)}`} accent />}
              <Row label="Shipping" value="Calculated at checkout" muted />
              <Row label="Estimated tax" value={money(t.tax)} />
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-[15px] font-medium">Estimated total</span>
              <span className="text-[20px] font-medium">{money(t.total)}</span>
            </div>

            {/* coupon */}
            <div className="mt-6 border-t border-line pt-5">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl bg-forest/5 px-3.5 py-3">
                  <span className="inline-flex items-center gap-2 text-[13px] text-forest">
                    <Tag size={14} /> {coupon} applied
                  </span>
                  <button onClick={clearCoupon} className="text-[12px] text-ink-muted hover:text-ink">Remove</button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (applyCoupon(code)) setCode('');
                  }}
                >
                  <label className="label" htmlFor="coupon">Discount code</label>
                  <div className="flex gap-2">
                    <input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" className="field" />
                    <button type="submit" className="btn-secondary btn-sm shrink-0">Apply</button>
                  </div>
                  {couponError && <p className="mt-2 text-[12px] text-sale">{couponError}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {coupons.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => applyCoupon(c.code)}
                        title={c.label}
                        className="chip text-[11px]"
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                </form>
              )}
            </div>

            <Link href="/checkout" className="btn-primary mt-6 w-full">Proceed to checkout</Link>
            <p className="mt-3 text-center text-[12px] text-ink-muted">
              Demo store — no real payment is taken.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={accent ? 'text-forest' : muted ? 'text-ink-muted' : ''}>{value}</span>
    </div>
  );
}
