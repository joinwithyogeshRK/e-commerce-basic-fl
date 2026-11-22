'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useOrders } from '@/lib/store';
import { dateLong, money } from '@/lib/format';

export default function OrdersPage() {
  const { orders } = useOrders();

  if (orders.length === 0) {
    return (
      <div className="shell flex flex-col items-center gap-5 py-28 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
          <Package size={24} className="text-ink-muted" />
        </span>
        <h1 className="font-display text-[30px] font-semibold">No orders yet</h1>
        <p className="max-w-[420px] text-[14px] text-ink-muted">
          Once you place an order it will appear here with live tracking. Orders are stored in this
          browser for the demo.
        </p>
        <Link href="/shop" className="btn-primary mt-1">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="shell py-10">
      <p className="eyebrow">Your account</p>
      <h1 className="mt-2 font-display text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight">Orders</h1>
      <p className="mt-2 text-[13px] text-ink-muted">{orders.length} order{orders.length === 1 ? '' : 's'}</p>

      <ul className="mt-8 space-y-4">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/orders/${o.id}`} className="card flex flex-wrap items-center gap-5 p-5 transition-colors hover:border-line-strong">
              <div className="flex -space-x-3">
                {o.items.slice(0, 3).map((l) => (
                  <div key={l.key} className="relative h-[62px] w-[54px] overflow-hidden rounded-xl border border-line bg-paper">
                    <Image src={l.image} alt={l.name} fill sizes="54px" className="object-contain p-1.5" />
                  </div>
                ))}
                {o.items.length > 3 && (
                  <div className="flex h-[62px] w-[54px] items-center justify-center rounded-xl border border-line bg-paper text-[12px] text-ink-muted">
                    +{o.items.length - 3}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-medium">{o.id}</p>
                <p className="mt-0.5 text-[13px] text-ink-muted">
                  {dateLong(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} item
                  {o.items.reduce((n, i) => n + i.qty, 0) === 1 ? '' : 's'} · {money(o.totals.total)}
                </p>
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  {o.status === 'delivered'
                    ? 'Delivered'
                    : o.status === 'cancelled'
                      ? 'Cancelled'
                      : `Arriving around ${dateLong(o.estimatedDelivery)}`}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium capitalize ${
                  o.status === 'cancelled'
                    ? 'bg-sale/10 text-sale'
                    : o.status === 'delivered'
                      ? 'bg-forest/10 text-forest'
                      : 'bg-ink/5 text-ink'
                }`}
              >
                {o.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
