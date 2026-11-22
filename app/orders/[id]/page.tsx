'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CircleDot, Mail, Package, PartyPopper, Truck, XCircle } from 'lucide-react';
import { useMail, useMisc, useOrders } from '@/lib/store';
import { dateLong, money, timeShort } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

const FLOW: OrderStatus[] = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="shell py-20 text-[14px] text-ink-muted">Loading order…</div>}>
      <OrderDetail />
    </Suspense>
  );
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const { byId, advance } = useOrders();
  const { record } = useMail();
  const { toast } = useMisc();
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(params.get('placed') === '1');

  const order = byId(id);

  useEffect(() => {
    if (!celebrate) return;
    const t = window.setTimeout(() => setCelebrate(false), 6000);
    return () => window.clearTimeout(t);
  }, [celebrate]);

  if (!order) {
    return (
      <div className="shell flex flex-col items-center gap-4 py-28 text-center">
        <h1 className="font-display text-[26px] font-semibold">Order not found</h1>
        <p className="max-w-[420px] text-[14px] text-ink-muted">
          Orders are stored in this browser for the demo, so one placed elsewhere will not appear here.
        </p>
        <Link href="/orders" className="btn-primary mt-1">See your orders</Link>
      </div>
    );
  }

  const stepIndex = FLOW.indexOf(order.status);
  const cancelled = order.status === 'cancelled';

  async function resend() {
    setBusy(true);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'order_confirmation', order }),
      });
      const data = await res.json();
      if (data.message) record(data.message);
      toast('Confirmation email sent again');
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    const updated = advance(order!.id, 'cancelled', 'Cancelled at your request. Payment released.');
    toast('Order cancelled');
    if (updated) {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'shipping_update', order: updated }),
      });
      const data = await res.json();
      if (data.message) record(data.message);
    }
  }

  return (
    <div className="shell py-10">
      {celebrate && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 overflow-hidden rounded-3xl border border-forest/20 bg-forest/[0.06] p-7 sm:p-9"
        >
          <div className="flex items-start gap-4">
            <motion.span
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-white"
            >
              <PartyPopper size={22} />
            </motion.span>
            <div>
              <h1 className="font-display text-[clamp(1.6rem,3.4vw,2.2rem)] font-semibold leading-tight">
                {order.payment.status === 'paid' ? 'Payment successful — order placed.' : 'Order placed.'}
              </h1>
              <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-ink-soft">
                Thank you, {order.address.fullName.split(' ')[0]}. We have sent a confirmation to{' '}
                <strong>{order.address.email}</strong>
                {order.payment.status === 'paid'
                  ? ` and charged ${money(order.totals.total)}.`
                  : ` — you will pay ${money(order.totals.total)} on delivery.`}{' '}
                Estimated delivery is <strong>{dateLong(order.estimatedDelivery)}</strong>.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link href="/admin/emails" className="btn-primary btn-sm">
                  <Mail size={14} /> Read the email we sent
                </Link>
                <Link href="/shop" className="btn-secondary btn-sm">Keep shopping</Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h2 className="mt-2 font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight">{order.id}</h2>
          <p className="mt-2 text-[13px] text-ink-muted">
            Placed {dateLong(order.createdAt)} at {timeShort(order.createdAt)} · {order.items.length} item
            {order.items.length === 1 ? '' : 's'}
          </p>
        </div>
        <span
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium capitalize ${
            cancelled ? 'bg-sale/10 text-sale' : order.status === 'delivered' ? 'bg-forest/10 text-forest' : 'bg-ink text-paper'
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          {/* tracking */}
          <section className="card p-6 sm:p-7">
            <h3 className="text-[15px] font-medium">Tracking</h3>
            {cancelled ? (
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-sale/5 px-4 py-4 text-[13.5px] text-sale">
                <XCircle size={18} /> This order was cancelled and the payment released.
              </div>
            ) : (
              <>
                <ol className="mt-6 space-y-0">
                  {FLOW.map((s, i) => {
                    const done = i <= stepIndex;
                    const entry = [...order.timeline].reverse().find((t) => t.status === s);
                    return (
                      <li key={s} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                              done ? 'border-forest bg-forest text-white' : 'border-line bg-surface text-ink-muted'
                            }`}
                          >
                            {done ? <Check size={13} /> : <CircleDot size={12} />}
                          </span>
                          {i < FLOW.length - 1 && <span className={`w-px flex-1 ${i < stepIndex ? 'bg-forest' : 'bg-line'}`} />}
                        </div>
                        <div className={`pb-6 ${done ? '' : 'opacity-50'}`}>
                          <p className="text-[14px] font-medium capitalize">{s}</p>
                          <p className="mt-0.5 text-[13px] text-ink-muted">
                            {entry?.note ?? pending(s)}
                          </p>
                          {entry && (
                            <p className="mt-0.5 text-[12px] text-ink-muted">
                              {dateLong(entry.at)} · {timeShort(entry.at)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {order.status === 'shipped' && (
                  <p className="flex items-center gap-2 rounded-xl bg-paper px-4 py-3 text-[13px] text-ink-soft">
                    <Truck size={15} /> Tracking number{' '}
                    <span className="font-mono">TRK{order.id.replace(/\D/g, '').slice(-9)}</span>
                  </p>
                )}
              </>
            )}
          </section>

          {/* items */}
          <section className="card p-6 sm:p-7">
            <h3 className="text-[15px] font-medium">Items</h3>
            <ul className="mt-5 divide-y divide-line">
              {order.items.map((l) => (
                <li key={l.key} className="flex gap-4 py-4">
                  <Link href={`/product/${l.slug}`} className="relative h-[86px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-line bg-paper">
                    <Image src={l.image} alt={l.name} fill sizes="72px" className="object-contain p-2" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${l.slug}`} className="text-[14px] font-medium hover:underline">{l.name}</Link>
                    <p className="mt-0.5 text-[12.5px] text-ink-muted">{l.color} · Size {l.size} · Qty {l.qty}</p>
                  </div>
                  <span className="text-[14px]">{money(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-2.5">
            <button onClick={resend} disabled={busy} className="btn-secondary btn-sm">
              <Mail size={14} /> {busy ? 'Sending…' : 'Resend confirmation email'}
            </button>
            <Link href="/admin/emails" className="btn-ghost btn-sm">View email outbox</Link>
            {!cancelled && order.status !== 'delivered' && order.status !== 'shipped' && (
              <button onClick={cancel} className="btn-ghost btn-sm text-sale hover:bg-sale/5">Cancel order</button>
            )}
          </div>
        </div>

        {/* summary */}
        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="card space-y-6 p-6">
            <div>
              <h3 className="text-[15px] font-medium">Payment</h3>
              <dl className="mt-3 space-y-2 text-[13.5px]">
                <Row label="Method" value={methodLabel(order)} />
                <Row label="Status" value={order.payment.status === 'paid' ? 'Paid' : order.payment.status === 'pending' ? 'Due on delivery' : 'Failed'} />
                <Row label="Reference" value={order.payment.reference} mono />
              </dl>
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="text-[15px] font-medium">Totals</h3>
              <dl className="mt-3 space-y-2 text-[13.5px]">
                <Row label="Subtotal" value={money(order.totals.subtotal)} />
                {order.totals.discount > 0 && <Row label={`Discount${order.coupon ? ` (${order.coupon})` : ''}`} value={`−${money(order.totals.discount)}`} />}
                <Row label={`${order.shippingMethod.label} shipping`} value={order.totals.shipping === 0 ? 'Free' : money(order.totals.shipping)} />
                <Row label="Tax" value={money(order.totals.tax)} />
              </dl>
              <div className="mt-3 flex justify-between border-t border-line pt-3">
                <span className="text-[14px] font-medium">Total</span>
                <span className="text-[18px] font-medium">{money(order.totals.total)}</span>
              </div>
            </div>

            <div className="border-t border-line pt-5">
              <h3 className="flex items-center gap-2 text-[15px] font-medium">
                <Package size={15} /> Delivering to
              </h3>
              <address className="mt-3 text-[13.5px] not-italic leading-relaxed text-ink-muted">
                {order.address.fullName}<br />
                {order.address.line1}{order.address.line2 && <>, {order.address.line2}</>}<br />
                {order.address.city}{order.address.state && `, ${order.address.state}`} {order.address.postalCode}<br />
                {order.address.country}<br />
                <span className="mt-1.5 block">{order.address.email}</span>
              </address>
              <p className="mt-3 text-[13px]">
                Estimated delivery <strong>{dateLong(order.estimatedDelivery)}</strong>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={mono ? 'font-mono text-[12.5px]' : ''}>{value}</dd>
    </div>
  );
}

function methodLabel(order: { payment: { method: string; brand?: string; last4?: string } }) {
  if (order.payment.method === 'card') return `${order.payment.brand ?? 'Card'} •••• ${order.payment.last4}`;
  if (order.payment.method === 'upi') return 'UPI';
  return 'Cash on delivery';
}

function pending(s: OrderStatus) {
  switch (s) {
    case 'confirmed':
      return 'Waiting on payment capture.';
    case 'packed':
      return 'Not packed yet.';
    case 'shipped':
      return 'Not dispatched yet.';
    case 'delivered':
      return 'Not delivered yet.';
    default:
      return '';
  }
}
