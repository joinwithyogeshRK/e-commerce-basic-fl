'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Inbox, Mail, Trash2 } from 'lucide-react';
import { useMail, useMisc } from '@/lib/store';
import { dateShort, timeShort } from '@/lib/format';

const KIND_LABEL: Record<string, string> = {
  order_confirmation: 'Order confirmation',
  payment_receipt: 'Payment receipt',
  shipping_update: 'Shipping update',
  welcome: 'Welcome',
  admin_alert: 'Ops alert',
};

export default function AdminEmails() {
  const { outbox, clear } = useMail();
  const { toast } = useMisc();
  const [selected, setSelected] = useState<string | null>(outbox[0]?.id ?? null);

  const current = outbox.find((m) => m.id === selected) ?? outbox[0];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Transactional email</p>
          <h1 className="mt-2 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] font-semibold tracking-tight">Outbox</h1>
          <p className="mt-2 max-w-[620px] text-[13px] text-ink-muted">
            Every email the store sends is rendered here exactly as the customer receives it. Set a{' '}
            <code className="rounded bg-ink/5 px-1 py-0.5 font-mono text-[12px]">RESEND_API_KEY</code>{' '}
            environment variable and the same messages go out for real instead.
          </p>
        </div>
        {outbox.length > 0 && (
          <button
            onClick={() => {
              clear();
              setSelected(null);
              toast('Outbox cleared');
            }}
            className="btn-secondary btn-sm"
          >
            <Trash2 size={14} /> Clear outbox
          </button>
        )}
      </div>

      {outbox.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-paper">
            <Inbox size={22} className="text-ink-muted" />
          </span>
          <p className="font-display text-[22px]">The outbox is empty</p>
          <p className="max-w-[420px] text-[13.5px] text-ink-muted">
            Place an order, advance one through fulfilment, or subscribe to the newsletter — the
            messages land here instantly.
          </p>
          <Link href="/shop" className="btn-primary mt-3">Open the storefront</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <ul className="card divide-y divide-line overflow-hidden">
              {outbox.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setSelected(m.id)}
                    className={`w-full px-4 py-3.5 text-left transition-colors ${
                      current?.id === m.id ? 'bg-ink/[0.04]' : 'hover:bg-paper'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium">{m.subject}</span>
                      <span className="shrink-0 text-[11px] text-ink-muted">{timeShort(m.sentAt)}</span>
                    </div>
                    <p className="mt-1 truncate text-[12px] text-ink-muted">To {m.to}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10.5px]">{KIND_LABEL[m.kind] ?? m.kind}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10.5px] ${m.provider === 'resend' ? 'bg-forest/10 text-forest' : 'bg-clay/10 text-clay'}`}>
                        {m.provider === 'resend' ? 'Sent live' : 'Simulated'}
                      </span>
                      <span className="text-[10.5px] text-ink-muted">{dateShort(m.sentAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-8">
            {current && (
              <div className="card overflow-hidden">
                <div className="border-b border-line px-5 py-4">
                  <p className="flex items-center gap-2 text-[14px] font-medium">
                    <Mail size={15} /> {current.subject}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-muted">
                    To {current.to} · {dateShort(current.sentAt)} at {timeShort(current.sentAt)}
                  </p>
                </div>
                <iframe
                  title={current.subject}
                  srcDoc={current.html}
                  sandbox=""
                  className="h-[720px] w-full border-0 bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
