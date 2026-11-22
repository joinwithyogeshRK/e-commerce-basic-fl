'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CreditCard, Loader2, Lock, Smartphone, Truck, Wallet } from 'lucide-react';
import { useCart, useMail, useMisc, useOrders } from '@/lib/store';
import { shippingMethods } from '@/lib/seed';
import { money, orderNumber } from '@/lib/format';
import type { Address, Order, PaymentMethod } from '@/lib/types';

const STEPS = ['Delivery', 'Shipping', 'Payment'] as const;

const EMPTY: Address = {
  fullName: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United Kingdom',
};

export default function CheckoutPage() {
  const { lines, totals, coupon, clear, subtotal } = useCart();
  const { place } = useOrders();
  const { record } = useMail();
  const { toast } = useMisc();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shipping, setShipping] = useState(shippingMethods[0]);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' });
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const t = totals(shipping.price);

  if (lines.length === 0 && !processing) {
    return (
      <div className="shell flex flex-col items-center gap-5 py-28 text-center">
        <h1 className="font-display text-[28px] font-semibold">There is nothing to check out</h1>
        <p className="max-w-[380px] text-[14px] text-ink-muted">Add something to your bag first.</p>
        <Link href="/shop" className="btn-primary mt-1">Browse the shop</Link>
      </div>
    );
  }

  const set = (k: keyof Address, v: string) => {
    setAddress((a) => ({ ...a, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  function validateAddress() {
    const next: Record<string, string> = {};
    if (address.fullName.trim().length < 2) next.fullName = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address.email)) next.email = 'Enter a valid email';
    if (address.phone.replace(/\D/g, '').length < 7) next.phone = 'Enter a contact number';
    if (address.line1.trim().length < 4) next.line1 = 'Enter your street address';
    if (address.city.trim().length < 2) next.city = 'Enter your city';
    if (address.postalCode.trim().length < 3) next.postalCode = 'Enter a postcode';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function pay() {
    setPayError(null);
    setProcessing(true);

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, amount: t.total, card, upiId }),
      });
      const data = await res.json();

      if (!data.ok) {
        setPayError(data.message ?? 'Payment failed. Try another method.');
        setProcessing(false);
        return;
      }

      const now = new Date();
      const eta = new Date(now.getTime() + etaDays(shipping.id) * 86400000);
      const order: Order = {
        id: orderNumber(now),
        items: lines,
        address,
        shippingMethod: { id: shipping.id, label: shipping.label, price: shipping.price, eta: shipping.eta },
        payment: {
          method,
          status: data.status,
          reference: data.reference,
          last4: data.last4,
          brand: data.brand,
        },
        totals: t,
        coupon: coupon ?? undefined,
        status: 'placed',
        timeline: [{ status: 'placed', at: now.toISOString(), note: 'Order received and payment authorised.' }],
        createdAt: now.toISOString(),
        estimatedDelivery: eta.toISOString(),
      };

      place(order);

      // Fire the transactional email set.
      await Promise.all(
        (['order_confirmation', 'payment_receipt', 'admin_alert'] as const).map(async (kind) => {
          try {
            const r = await fetch('/api/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ kind, order }),
            });
            const d = await r.json();
            if (d.message) record(d.message);
          } catch {
            /* the order still stands if mail fails */
          }
        })
      );

      clear();
      toast('Order placed — confirmation email sent');
      router.push(`/orders/${order.id}?placed=1`);
    } catch {
      setPayError('We could not reach the payment service. Try again.');
      setProcessing(false);
    }
  }

  return (
    <div className="shell py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-[clamp(1.8rem,3.6vw,2.4rem)] font-semibold tracking-tight">Checkout</h1>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Lock size={13} /> Secure demo checkout
        </span>
      </div>

      {/* step rail */}
      <ol className="mb-9 flex items-center gap-3 sm:gap-5">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-3">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-2.5 text-[13px] ${i <= step ? 'text-ink' : 'text-ink-muted'} ${
                i < step ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[12px] ${
                  i < step
                    ? 'border-forest bg-forest text-white'
                    : i === step
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink-muted'
                }`}
              >
                {i < step ? <Check size={13} /> : i + 1}
              </span>
              <span className="hidden font-medium sm:inline">{label}</span>
            </button>
            {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < step ? 'bg-forest' : 'bg-line'}`} />}
          </li>
        ))}
      </ol>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <AnimatePresence mode="wait">
            {/* ---------------- step 1 ---------------- */}
            {step === 0 && (
              <motion.section key="address" {...fade} className="card p-6 sm:p-8">
                <h2 className="text-[17px] font-medium">Delivery details</h2>
                <p className="mt-1 text-[13px] text-ink-muted">Where should we send your order?</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" value={address.fullName} onChange={(v) => set('fullName', v)} error={errors.fullName} className="sm:col-span-2" autoComplete="name" />
                  <Field label="Email" type="email" value={address.email} onChange={(v) => set('email', v)} error={errors.email} autoComplete="email" hint="Your confirmation is sent here" />
                  <Field label="Phone" value={address.phone} onChange={(v) => set('phone', v)} error={errors.phone} autoComplete="tel" />
                  <Field label="Address" value={address.line1} onChange={(v) => set('line1', v)} error={errors.line1} className="sm:col-span-2" autoComplete="address-line1" />
                  <Field label="Apartment, suite (optional)" value={address.line2 ?? ''} onChange={(v) => set('line2', v)} className="sm:col-span-2" autoComplete="address-line2" />
                  <Field label="City" value={address.city} onChange={(v) => set('city', v)} error={errors.city} autoComplete="address-level2" />
                  <Field label="County / State" value={address.state} onChange={(v) => set('state', v)} autoComplete="address-level1" />
                  <Field label="Postcode" value={address.postalCode} onChange={(v) => set('postalCode', v)} error={errors.postalCode} autoComplete="postal-code" />
                  <div>
                    <label className="label" htmlFor="country">Country</label>
                    <select id="country" value={address.country} onChange={(e) => set('country', e.target.value)} className="field">
                      {['United Kingdom', 'India', 'United States', 'Germany', 'France', 'Japan', 'Australia'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => validateAddress() && setStep(1)}
                    className="btn-primary"
                  >
                    Continue to shipping
                  </button>
                  <button
                    onClick={() => {
                      setAddress({
                        fullName: 'Yogesh Gurani',
                        email: 'demo@atlasandoak.com',
                        phone: '+44 7700 900123',
                        line1: '22 Nieuwstraat',
                        line2: 'Flat 4',
                        city: 'London',
                        state: 'Greater London',
                        postalCode: 'EC1A 4JR',
                        country: 'United Kingdom',
                      });
                      setErrors({});
                    }}
                    className="text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink"
                  >
                    Fill with demo details
                  </button>
                </div>
              </motion.section>
            )}

            {/* ---------------- step 2 ---------------- */}
            {step === 1 && (
              <motion.section key="shipping" {...fade} className="card p-6 sm:p-8">
                <h2 className="text-[17px] font-medium">Shipping method</h2>
                <p className="mt-1 text-[13px] text-ink-muted">
                  Delivering to {address.city}, {address.country}
                </p>

                <div className="mt-6 space-y-3">
                  {shippingMethods.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setShipping(s)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
                        shipping.id === s.id ? 'border-ink bg-ink/[0.03]' : 'border-line hover:border-line-strong'
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${shipping.id === s.id ? 'border-ink' : 'border-line-strong'}`}>
                        {shipping.id === s.id && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                      </span>
                      <Truck size={18} className="shrink-0 text-ink-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium">{s.label}</span>
                        <span className="block text-[12.5px] text-ink-muted">{s.eta} · {s.note}</span>
                      </span>
                      <span className="shrink-0 text-[14px] font-medium">
                        {s.price === 0 ? 'Free' : money(s.price)}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-7 flex gap-3">
                  <button onClick={() => setStep(0)} className="btn-secondary">Back</button>
                  <button onClick={() => setStep(2)} className="btn-primary">Continue to payment</button>
                </div>
              </motion.section>
            )}

            {/* ---------------- step 3 ---------------- */}
            {step === 2 && (
              <motion.section key="payment" {...fade} className="card p-6 sm:p-8">
                <h2 className="text-[17px] font-medium">Payment</h2>
                <p className="mt-1 text-[13px] text-ink-muted">
                  This is a simulation — no real gateway, no real charge.
                </p>

                <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
                  {([
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'upi', label: 'UPI', icon: Smartphone },
                    { id: 'cod', label: 'Cash on delivery', icon: Wallet },
                  ] as const).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMethod(m.id);
                        setPayError(null);
                      }}
                      className={`flex items-center gap-2.5 rounded-2xl border p-4 text-left text-[13.5px] transition-colors ${
                        method === m.id ? 'border-ink bg-ink/[0.03]' : 'border-line hover:border-line-strong'
                      }`}
                    >
                      <m.icon size={17} className="shrink-0 text-ink-muted" />
                      {m.label}
                    </button>
                  ))}
                </div>

                {method === 'card' && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Card number"
                      value={card.number}
                      onChange={(v) => setCard((c) => ({ ...c, number: formatCard(v) }))}
                      placeholder="4242 4242 4242 4242"
                      className="sm:col-span-2"
                      inputMode="numeric"
                    />
                    <Field label="Name on card" value={card.name} onChange={(v) => setCard((c) => ({ ...c, name: v }))} placeholder="Y Gurani" className="sm:col-span-2" />
                    <Field label="Expiry" value={card.expiry} onChange={(v) => setCard((c) => ({ ...c, expiry: formatExpiry(v) }))} placeholder="04/29" inputMode="numeric" />
                    <Field label="Security code" value={card.cvc} onChange={(v) => setCard((c) => ({ ...c, cvc: v.replace(/\D/g, '').slice(0, 4) }))} placeholder="123" inputMode="numeric" />

                    <div className="rounded-2xl bg-paper p-4 text-[12.5px] leading-relaxed text-ink-muted sm:col-span-2">
                      <p className="mb-1.5 font-medium text-ink">Test cards</p>
                      <p><code className="font-mono">4242 4242 4242 4242</code> — approved</p>
                      <p><code className="font-mono">4000 0000 0000 0002</code> — declined by bank</p>
                      <p><code className="font-mono">4000 0000 0000 9995</code> — insufficient funds</p>
                    </div>
                  </div>
                )}

                {method === 'upi' && (
                  <div className="mt-6">
                    <Field label="UPI ID" value={upiId} onChange={setUpiId} placeholder="yourname@okbank" hint="Try fail@okbank to see a declined payment" />
                  </div>
                )}

                {method === 'cod' && (
                  <div className="mt-6 rounded-2xl bg-paper p-5 text-[13.5px] leading-relaxed text-ink-muted">
                    Pay {money(t.total)} in cash when your order arrives. Please have the exact
                    amount ready — our couriers do not carry change.
                  </div>
                )}

                {payError && (
                  <p className="mt-5 rounded-xl border border-sale/30 bg-sale/5 px-4 py-3 text-[13px] text-sale">
                    {payError}
                  </p>
                )}

                <div className="mt-7 flex gap-3">
                  <button onClick={() => setStep(1)} disabled={processing} className="btn-secondary">Back</button>
                  <button onClick={pay} disabled={processing} className="btn-primary min-w-[220px]">
                    {processing ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Processing payment…
                      </>
                    ) : (
                      <>
                        <Lock size={14} /> Pay {money(t.total)}
                      </>
                    )}
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* summary */}
        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="card sticky top-28 p-6">
            <h2 className="text-[16px] font-medium">Your order</h2>
            <ul className="mt-5 space-y-4">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3.5">
                  <div className="relative h-[66px] w-[56px] shrink-0 overflow-hidden rounded-xl border border-line bg-paper">
                    <Image src={l.image} alt={l.name} fill sizes="56px" className="object-contain p-1.5" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
                      {l.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{l.name}</p>
                    <p className="text-[12px] text-ink-muted">{l.color} · {l.size}</p>
                  </div>
                  <span className="shrink-0 text-[13px]">{money(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 border-t border-line pt-5 text-[13.5px]">
              <div className="flex justify-between"><span className="text-ink-muted">Subtotal</span><span>{money(t.subtotal)}</span></div>
              {t.discount > 0 && (
                <div className="flex justify-between text-forest"><span>Discount ({coupon})</span><span>−{money(t.discount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-ink-muted">{shipping.label} shipping</span><span>{t.shipping === 0 ? 'Free' : money(t.shipping)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Tax</span><span>{money(t.tax)}</span></div>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-[15px] font-medium">Total</span>
              <span className="text-[22px] font-medium">{money(t.total)}</span>
            </div>

            {subtotal >= 300 && !coupon && (
              <p className="mt-4 rounded-xl bg-forest/5 px-3.5 py-3 text-[12.5px] text-forest">
                Tip: code <strong>STYLE20</strong> takes 20% off orders over $300.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
};

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
  const id = label.toLowerCase().replace(/[^a-z]+/g, '-');
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`field ${error ? 'border-sale' : ''}`} {...rest} />
      {error ? (
        <p className="mt-1.5 text-[12px] text-sale">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function formatCard(v: string) {
  return v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

function etaDays(id: string) {
  return id === 'priority' ? 1 : id === 'express' ? 3 : 6;
}
