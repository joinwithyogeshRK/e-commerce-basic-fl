'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/lib/store';
import { money } from '@/lib/format';

export default function CartDrawer() {
  const { lines, drawerOpen, setDrawerOpen, setQty, remove, subtotal, count } = useCart();

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-[71] flex h-full w-full max-w-[420px] flex-col bg-paper"
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag size={17} />
                <span className="text-[14px] font-medium">Your bag</span>
                <span className="text-[13px] text-ink-muted">({count})</span>
              </div>
              <button aria-label="Close cart" onClick={() => setDrawerOpen(false)} className="rounded-full p-2 hover:bg-ink/5">
                <X size={17} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="font-display text-[22px]">Your bag is empty</p>
                  <p className="max-w-[240px] text-[13px] text-ink-muted">
                    Add a piece and it will show up here with live totals.
                  </p>
                  <Link href="/shop" onClick={() => setDrawerOpen(false)} className="btn-primary">
                    Start shopping
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <motion.li
                        key={l.key}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="flex gap-4 overflow-hidden py-4"
                      >
                        <Link
                          href={`/product/${l.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          className="relative h-[94px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-surface"
                        >
                          <Image src={l.image} alt={l.name} fill sizes="76px" className="object-contain p-2" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <p className="truncate text-[14px] font-medium">{l.name}</p>
                            <p className="mt-0.5 text-[12px] text-ink-muted">
                              {l.color} · {l.size}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 rounded-full border border-line px-2.5 py-1">
                              <button aria-label="Decrease" onClick={() => setQty(l.key, l.qty - 1)} className="text-ink-muted hover:text-ink">
                                <Minus size={13} />
                              </button>
                              <span className="min-w-[14px] text-center text-[13px] tabular-nums">{l.qty}</span>
                              <button aria-label="Increase" onClick={() => setQty(l.key, l.qty + 1)} className="text-ink-muted hover:text-ink">
                                <Plus size={13} />
                              </button>
                            </div>
                            <span className="text-[13px]">{money(l.price * l.qty)}</span>
                          </div>
                        </div>
                        <button aria-label={`Remove ${l.name}`} onClick={() => remove(l.key)} className="self-start text-ink-muted hover:text-ink">
                          <X size={14} />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <footer className="space-y-3 border-t border-line px-5 py-5">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-ink-muted">Subtotal</span>
                  <span className="text-[16px] font-medium">{money(subtotal)}</span>
                </div>
                <p className="text-[12px] text-ink-muted">
                  Shipping and tax calculated at checkout. Standard shipping is free.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/cart" onClick={() => setDrawerOpen(false)} className="btn-secondary">
                    View cart
                  </Link>
                  <Link href="/checkout" onClick={() => setDrawerOpen(false)} className="btn-primary">
                    Checkout
                  </Link>
                </div>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
