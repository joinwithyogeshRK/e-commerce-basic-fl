'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Bot, Sparkles, X } from 'lucide-react';
import { useCart, useCatalog, useMisc, useOrders } from '@/lib/store';
import { starterPrompts, type LiteProduct } from '@/lib/assistant/engine';
import { money } from '@/lib/format';
import type { ChatMessage } from '@/lib/types';

const uid = () => `m_${Math.random().toString(36).slice(2, 10)}`;

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      at: '',
      text: 'Hello — I am **Ora**, the Atlas & Oak assistant. I can find pieces, explain sizing, apply a discount, track an order or take you through checkout. What are you looking for?',
      suggestions: starterPrompts,
    },
  ]);

  const { products, byId } = useCatalog();
  const { lines, add } = useCart();
  const { orders } = useOrders();
  const { toast } = useMisc();
  const router = useRouter();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  const lite = useMemo<LiteProduct[]>(
    () =>
      products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        subcategory: p.subcategory,
        gender: p.gender,
        price: p.price,
        compareAt: p.compareAt,
        sizes: p.sizes,
        rating: p.rating,
        tags: p.tags,
        material: p.material,
        colors: p.colors.map((c) => c.name),
        inStock: p.stock > 0,
      })),
    [products]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (pathname.startsWith('/admin')) return null;

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;

    setMessages((prev) => [...prev, { id: uid(), role: 'user', text, at: new Date().toISOString() }]);
    setInput('');
    setBusy(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            products: lite,
            focus,
            cart: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price, size: l.size, color: l.color })),
            orders: orders.map((o) => ({
              id: o.id,
              status: o.status,
              total: o.totals.total,
              createdAt: o.createdAt,
              estimatedDelivery: o.estimatedDelivery,
              itemCount: o.items.reduce((n, i) => n + i.qty, 0),
            })),
          },
        }),
      });
      const data = await res.json();

      if (data.productIds?.length) setFocus(data.productIds);

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          text: data.reply ?? 'Something went wrong on my side — try again?',
          at: new Date().toISOString(),
          products: data.productIds,
          suggestions: data.suggestions,
        },
      ]);

      if (data.action?.type === 'add_to_cart') {
        const p = byId(data.action.productId);
        if (p) {
          add(p, { size: data.action.size, silent: true });
          toast(`${p.name} added to bag`);
        }
      }
      if (data.action?.type === 'navigate') {
        const href = data.action.href as string;
        window.setTimeout(() => router.push(href), 900);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          at: new Date().toISOString(),
          text: 'I could not reach the assistant service just then. Try once more?',
          suggestions: starterPrompts,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label={open ? 'Close assistant' : 'Open shopping assistant'}
        className="fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-pop"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'x' : 'bot'}
            initial={{ opacity: 0, rotate: -40 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 40 }}
            transition={{ duration: 0.2 }}
          >
            {open ? <X size={21} /> : <Bot size={22} />}
          </motion.span>
        </AnimatePresence>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-clay">
            <Sparkles size={9} className="text-white" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[86px] right-4 z-[80] flex h-[min(620px,76vh)] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-pop"
          >
            <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper">
                <Bot size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-none">Ora</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Shopping assistant · online
                </p>
              </div>
              <button aria-label="Close" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-ink/5">
                <X size={16} />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className="space-y-2.5">
                  <div className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                        m.role === 'user'
                          ? 'rounded-br-md bg-ink text-paper'
                          : 'rounded-bl-md border border-line bg-surface text-ink-soft'
                      }`}
                    >
                      <Rich text={m.text} />
                    </div>
                  </div>

                  {m.products && m.products.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {m.products.map((id) => {
                        const p = byId(id);
                        if (!p) return null;
                        return (
                          <div key={id} className="overflow-hidden rounded-xl border border-line bg-surface">
                            <Link href={`/product/${p.slug}`} onClick={() => setOpen(false)} className="block">
                              <div className="relative aspect-square bg-paper">
                                <Image src={p.colors[0].image} alt={p.name} fill sizes="160px" className="object-contain p-2.5" />
                              </div>
                              <div className="px-2.5 pb-1 pt-2">
                                <p className="truncate text-[12px] font-medium">{p.name}</p>
                                <p className="text-[12px] text-ink-muted">{money(p.price)}</p>
                              </div>
                            </Link>
                            <button
                              onClick={() => {
                                add(p, { silent: true });
                                toast(`${p.name} added to bag`);
                              }}
                              className="m-2 w-[calc(100%-1rem)] rounded-full border border-line py-1.5 text-[11px] font-medium transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                            >
                              Add to bag
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {m.role === 'assistant' && m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestions.map((s) => (
                        <button key={s} onClick={() => send(s)} className="chip text-[11.5px]">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {busy && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                        className="h-1.5 w-1.5 rounded-full bg-ink-muted"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-line bg-surface px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about sizing, orders, anything…"
                className="w-full rounded-full border border-line bg-paper px-4 py-2.5 text-[13.5px] outline-none transition-colors focus:border-forest"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-opacity disabled:opacity-40"
              >
                <ArrowUp size={17} />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

/** Minimal inline formatting: **bold** and `code`. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return (
            <strong key={i} className="font-semibold text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        if (part.startsWith('`') && part.endsWith('`'))
          return (
            <code key={i} className="rounded bg-ink/5 px-1 py-0.5 font-mono text-[12px]">
              {part.slice(1, -1)}
            </code>
          );
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
