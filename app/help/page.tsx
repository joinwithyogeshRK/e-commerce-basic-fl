import type { Metadata } from 'next';
import Link from 'next/link';
import { policies, shippingMethods, sizeGuide } from '@/lib/seed';
import { money } from '@/lib/format';

export const metadata: Metadata = { title: 'Help & policies' };

export default function HelpPage() {
  return (
    <div className="shell max-w-[860px] py-12">
      <p className="eyebrow">Client care</p>
      <h1 className="mt-2 font-display text-[clamp(2rem,4.4vw,2.8rem)] font-semibold tracking-tight">
        Help &amp; policies
      </h1>
      <p className="mt-4 max-w-[560px] text-[15px] leading-relaxed text-ink-muted">
        Everything below is also answerable by Ora, our assistant — tap the button in the
        bottom-right corner and ask in your own words.
      </p>

      <section id="shipping" className="mt-12 scroll-mt-28">
        <h2 className="font-display text-[24px] font-semibold">Shipping &amp; delivery</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{policies.shipping}</p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-line">
          {shippingMethods.map((s, i) => (
            <div key={s.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${i % 2 ? 'bg-paper' : 'bg-surface'}`}>
              <div>
                <p className="text-[14px] font-medium">{s.label}</p>
                <p className="text-[12.5px] text-ink-muted">{s.eta} · {s.note}</p>
              </div>
              <span className="text-[14px] font-medium">{s.price === 0 ? 'Free' : money(s.price)}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="returns" className="mt-12 scroll-mt-28">
        <h2 className="font-display text-[24px] font-semibold">Returns &amp; exchanges</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{policies.returns}</p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{policies.exchange}</p>
      </section>

      <section id="sizing" className="mt-12 scroll-mt-28">
        <h2 className="font-display text-[24px] font-semibold">Size guide</h2>
        <p className="mt-3 text-[14.5px] text-ink-muted">
          Apparel is cut relaxed — size down for a classic fit. Footwear runs true to size.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Table title="Apparel" rows={sizeGuide.clothing.map((r) => [r.size, `Chest ${r.chest}`, `Waist ${r.waist}`])} />
          <Table title="Footwear" rows={sizeGuide.footwear.map((r) => [r.size, r.eu, r.cm])} />
        </div>
      </section>

      <section id="payment" className="mt-12 scroll-mt-28">
        <h2 className="font-display text-[24px] font-semibold">Payment</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{policies.payment}</p>
        <div className="mt-4 rounded-2xl bg-surface p-5 text-[13.5px] leading-relaxed text-ink-muted">
          <p className="mb-2 font-medium text-ink">Test cards for the demo checkout</p>
          <p><code className="font-mono">4242 4242 4242 4242</code> — approved</p>
          <p><code className="font-mono">4000 0000 0000 0002</code> — declined by bank</p>
          <p><code className="font-mono">4000 0000 0000 9995</code> — insufficient funds</p>
        </div>
      </section>

      <section id="warranty" className="mt-12 scroll-mt-28">
        <h2 className="font-display text-[24px] font-semibold">Warranty</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{policies.warranty}</p>
      </section>

      <section id="contact" className="mt-12 scroll-mt-28">
        <h2 className="font-display text-[24px] font-semibold">Contact</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{policies.contact}</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link href="/orders" className="btn-secondary btn-sm">Track an order</Link>
          <Link href="/admin/emails" className="btn-ghost btn-sm">Email outbox</Link>
        </div>
      </section>
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <p className="bg-ink px-4 py-2.5 text-[12px] font-medium uppercase tracking-wide2 text-paper">{title}</p>
      <table className="w-full text-[13px]">
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[0]} className={i % 2 ? 'bg-paper' : 'bg-surface'}>
              {r.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? 'font-medium' : 'text-ink-muted'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
