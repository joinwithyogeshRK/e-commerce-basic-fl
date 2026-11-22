'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, DollarSign, Mail, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { useCatalog, useMail, useOrders } from '@/lib/store';
import { dateShort, money } from '@/lib/format';

export default function AdminDashboard() {
  const { products } = useCatalog();
  const { orders } = useOrders();
  const { outbox } = useMail();

  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((n, o) => n + o.totals.total, 0);
  const units = orders.reduce((n, o) => n + o.items.reduce((m, i) => m + i.qty, 0), 0);
  const aov = orders.length ? revenue / orders.length : 0;
  const lowStock = products.filter((p) => p.stock < 20).sort((a, b) => a.stock - b.stock).slice(0, 5);

  const bestSellers = Object.entries(
    orders.flatMap((o) => o.items).reduce<Record<string, number>>((acc, l) => {
      acc[l.productId] = (acc[l.productId] ?? 0) + l.qty;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const stats = [
    { label: 'Revenue', value: money(revenue), icon: DollarSign, note: `${orders.length} order${orders.length === 1 ? '' : 's'}` },
    { label: 'Units sold', value: String(units), icon: TrendingUp, note: 'Across all orders' },
    { label: 'Average order', value: money(aov), icon: ShoppingCart, note: 'Per order value' },
    { label: 'Products live', value: String(products.length), icon: Package, note: `${products.filter((p) => p.stock === 0).length} out of stock` },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] font-semibold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex gap-2.5">
          <Link href="/admin/products/new" className="btn-primary btn-sm">Add product</Link>
          <Link href="/admin/orders" className="btn-secondary btn-sm">Manage orders</Link>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-start justify-between">
              <p className="text-[12.5px] text-ink-muted">{s.label}</p>
              <s.icon size={16} className="text-ink-muted" />
            </div>
            <p className="mt-3 font-display text-[28px] font-semibold leading-none">{s.value}</p>
            <p className="mt-2 text-[12px] text-ink-muted">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[12.5px] text-ink-muted hover:text-ink">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="mt-6 text-[13.5px] text-ink-muted">
              No orders yet. Place one from the storefront to see it land here, with its emails in the outbox.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[12px] text-ink-muted">
                    <th className="pb-2.5 font-medium">Order</th>
                    <th className="pb-2.5 font-medium">Customer</th>
                    <th className="pb-2.5 font-medium">Date</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.slice(0, 6).map((o) => (
                    <tr key={o.id}>
                      <td className="py-3">
                        <Link href={`/orders/${o.id}`} className="font-medium hover:underline">{o.id}</Link>
                      </td>
                      <td className="py-3 text-ink-muted">{o.address.fullName}</td>
                      <td className="py-3 text-ink-muted">{dateShort(o.createdAt)}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11.5px] capitalize">{o.status}</span>
                      </td>
                      <td className="py-3 text-right">{money(o.totals.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-[15px] font-medium">Low stock</h2>
          <ul className="mt-5 space-y-3.5">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-paper">
                  <Image src={p.colors[0].image} alt={p.name} fill sizes="44px" className="object-contain p-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="block truncate text-[13px] font-medium hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-[12px] text-ink-muted">{p.subcategory}</p>
                </div>
                <span className={`shrink-0 text-[12.5px] ${p.stock < 15 ? 'text-sale' : 'text-ink-muted'}`}>
                  {p.stock} left
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-[15px] font-medium">Best sellers</h2>
          {bestSellers.length === 0 ? (
            <p className="mt-5 text-[13px] text-ink-muted">Nothing sold yet.</p>
          ) : (
            <ul className="mt-5 space-y-3.5">
              {bestSellers.map(([id, qty]) => {
                const p = products.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <li key={id} className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-paper">
                      <Image src={p.colors[0].image} alt={p.name} fill sizes="44px" className="object-contain p-1" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{p.name}</p>
                    <span className="shrink-0 text-[12.5px] text-ink-muted">{qty} sold</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-medium"><Mail size={15} /> Latest email</h2>
            <Link href="/admin/emails" className="inline-flex items-center gap-1 text-[12.5px] text-ink-muted hover:text-ink">
              Open outbox <ArrowUpRight size={13} />
            </Link>
          </div>
          {outbox.length === 0 ? (
            <p className="mt-5 text-[13.5px] text-ink-muted">
              No email sent yet. Place an order or subscribe to the newsletter and the messages land here.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {outbox.slice(0, 4).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">{m.subject}</p>
                    <p className="truncate text-[12px] text-ink-muted">To {m.to} · {m.preheader}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] capitalize">
                    {m.kind.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
