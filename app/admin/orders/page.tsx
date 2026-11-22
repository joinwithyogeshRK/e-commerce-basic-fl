'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, Mail, Send } from 'lucide-react';
import { useMail, useMisc, useOrders } from '@/lib/store';
import { dateShort, money, timeShort } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'confirmed',
  confirmed: 'packed',
  packed: 'shipped',
  shipped: 'delivered',
};

export default function AdminOrders() {
  const { orders, advance } = useOrders();
  const { record } = useMail();
  const { toast } = useMisc();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  const rows = filter ? orders.filter((o) => o.status === filter) : orders;

  async function moveOn(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const next = NEXT[order.status];
    if (!next) return;

    setBusy(id);
    const updated = advance(id, next);
    try {
      if (updated) {
        const res = await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'shipping_update', order: updated }),
        });
        const data = await res.json();
        if (data.message) record(data.message);
      }
      toast(`Order moved to ${next} — customer emailed`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Fulfilment</p>
          <h1 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] font-semibold tracking-tight">Orders</h1>
          <p className="mt-2 text-[13px] text-ink-muted">
            {orders.length} order{orders.length === 1 ? '' : 's'} · advancing an order emails the customer
          </p>
        </div>
        <Link href="/admin/emails" className="btn-secondary btn-sm"><Mail size={14} /> Email outbox</Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {['', 'placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button key={s || 'all'} onClick={() => setFilter(s)} className={`chip capitalize ${filter === s ? 'chip-active' : ''}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="card mt-6 p-16 text-center">
          <p className="font-display text-[22px]">No orders yet</p>
          <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] text-ink-muted">
            Place an order from the storefront — it will appear here with its full timeline, and you
            can move it through fulfilment.
          </p>
          <Link href="/shop" className="btn-primary mt-5">Open the storefront</Link>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {rows.map((o) => {
            const next = NEXT[o.status];
            return (
              <div key={o.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link href={`/orders/${o.id}`} className="text-[15px] font-medium hover:underline">{o.id}</Link>
                      <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium capitalize ${
                        o.status === 'cancelled' ? 'bg-sale/10 text-sale' : o.status === 'delivered' ? 'bg-forest/10 text-forest' : 'bg-ink/5'
                      }`}>
                        {o.status}
                      </span>
                      <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11.5px] capitalize">
                        {o.payment.method} · {o.payment.status}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] text-ink-muted">
                      {o.address.fullName} · {o.address.email}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-ink-muted">
                      {dateShort(o.createdAt)} at {timeShort(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} units ·{' '}
                      {o.shippingMethod.label}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[17px] font-medium">{money(o.totals.total)}</span>
                    {next ? (
                      <button onClick={() => moveOn(o.id)} disabled={busy === o.id} className="btn-primary btn-sm">
                        <Send size={13} /> {busy === o.id ? 'Working…' : `Mark ${next}`}
                      </button>
                    ) : (
                      <Link href={`/orders/${o.id}`} className="btn-secondary btn-sm">
                        View <ChevronRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>

                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3.5 text-[12.5px] text-ink-muted">
                  {o.items.map((l) => (
                    <li key={l.key}>{l.qty} × {l.name} <span className="opacity-60">({l.color}, {l.size})</span></li>
                  ))}
                </ul>
              </div>
            );
          })}

          {rows.length === 0 && (
            <p className="card p-12 text-center text-[13.5px] text-ink-muted">No orders with that status.</p>
          )}
        </div>
      )}
    </>
  );
}
