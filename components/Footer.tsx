'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useMail, useMisc } from '@/lib/store';

const columns = [
  { title: 'Shop', links: [['Shop all', '/shop'], ['Clothing', '/shop?category=clothing'], ['Footwear', '/shop?category=footwear'], ['Accessories', '/shop?category=accessories'], ['Sale', '/shop?sale=1']] },
  { title: 'Client care', links: [['Track an order', '/orders'], ['Shipping & delivery', '/help#shipping'], ['Returns & exchanges', '/help#returns'], ['Size guide', '/help#sizing'], ['Contact us', '/help#contact']] },
  { title: 'House', links: [['Our story', '/about'], ['Sustainability', '/about#sustainability'], ['Admin dashboard', '/admin'], ['Email outbox', '/admin/emails']] },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const { record } = useMail();
  const { toast } = useMisc();
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setState('error');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'welcome', email }),
      });
      const data = await res.json();
      if (data.message) record(data.message);
      setState('done');
      setEmail('');
      toast('Welcome email sent — open the outbox to read it');
    } catch {
      setState('error');
    }
  };

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="shell grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="font-display text-[22px] font-semibold">Atlas &amp; Oak</p>
          <p className="mt-3 max-w-[300px] text-[13px] leading-relaxed text-ink-muted">
            Fewer things, made properly. Clothing, footwear and accessories from four ateliers in
            Antwerp, Porto, Milan and Kyoto.
          </p>

          <form onSubmit={subscribe} className="mt-7 max-w-[340px]">
            <label className="label" htmlFor="newsletter">Join the list — 10% off your first order</label>
            <div className="flex gap-2">
              <input
                id="newsletter"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state !== 'idle') setState('idle');
                }}
                placeholder="your@email.com"
                className="field"
              />
              <button type="submit" disabled={state === 'sending'} className="btn-primary shrink-0">
                {state === 'sending' ? 'Sending…' : 'Join'}
              </button>
            </div>
            <p className="mt-2 h-4 text-[12px]">
              {state === 'done' && <span className="text-forest">Sent — check the outbox to read the email.</span>}
              {state === 'error' && <span className="text-sale">That email does not look right.</span>}
              {state === 'idle' && <span className="text-ink-muted">One letter a month. Unsubscribe any time.</span>}
            </p>
          </form>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="lg:col-span-2">
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="link-underline text-[13px] text-ink-soft hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="lg:col-span-2">
          <p className="eyebrow">Demo notes</p>
          <ul className="mt-4 space-y-2.5 text-[12px] leading-relaxed text-ink-muted">
            <li>No database — data lives in your browser.</li>
            <li>Card 4242 4242 4242 4242 always succeeds.</li>
            <li>Email is captured in the in-app outbox.</li>
            <li>Admin login: admin@atlasandoak.com / admin123</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-[12px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Atlas &amp; Oak. A demonstration storefront.</p>
          <p className="flex gap-4">
            <Link href="/help" className="hover:text-ink">Help</Link>
            <Link href="/help#returns" className="hover:text-ink">Returns</Link>
            <Link href="/help#contact" className="hover:text-ink">Contact</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
