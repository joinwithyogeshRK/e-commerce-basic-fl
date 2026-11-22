'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, LayoutDashboard, Menu, Package, Search, ShoppingBag, X } from 'lucide-react';
import { useCart, useMisc } from '@/lib/store';

const links = [
  { label: 'Shop all', href: '/shop' },
  { label: 'Clothing', href: '/shop?category=clothing' },
  { label: 'Footwear', href: '/shop?category=footwear' },
  { label: 'Accessories', href: '/shop?category=accessories' },
  { label: 'Sale', href: '/shop?sale=1' },
];

const announcements = [
  'Free standard shipping on every order',
  'Use WELCOME10 for 10% off your first order',
  '30-day free returns and exchanges',
];

export default function Header() {
  const { count, setDrawerOpen } = useCart();
  const { wishlist } = useMisc();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => (t + 1) % announcements.length), 4600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    if (search) inputRef.current?.focus();
  }, [search]);

  if (pathname.startsWith('/admin')) return null;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    setSearch(false);
    setQuery('');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="bg-ink text-paper">
        <div className="shell flex h-9 items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={tick}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-[11px] tracking-wide2"
            >
              {announcements[tick]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setMenu(true)}
            className="-ml-2 rounded-full p-2 hover:bg-ink/5"
          >
            <Menu size={19} />
          </button>
        </div>

        <Link href="/" className="font-display text-[20px] font-semibold leading-none tracking-tight">
          Atlas <span className="text-ink-muted">&amp;</span> Oak
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="link-underline text-[13px] text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5">
          <button aria-label="Search" onClick={() => setSearch((s) => !s)} className="rounded-full p-2.5 hover:bg-ink/5">
            <Search size={18} />
          </button>
          <Link aria-label="Orders" href="/orders" className="hidden rounded-full p-2.5 hover:bg-ink/5 sm:block">
            <Package size={18} />
          </Link>
          <Link aria-label="Wishlist" href="/wishlist" className="relative hidden rounded-full p-2.5 hover:bg-ink/5 sm:block">
            <Heart size={18} />
            {wishlist.length > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-clay" />
            )}
          </Link>
          <Link aria-label="Admin" href="/admin" className="hidden rounded-full p-2.5 hover:bg-ink/5 sm:block">
            <LayoutDashboard size={18} />
          </Link>
          <button aria-label="Cart" onClick={() => setDrawerOpen(true)} className="relative rounded-full p-2.5 hover:bg-ink/5">
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {search && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line bg-surface"
          >
            <form onSubmit={submitSearch} className="shell flex items-center gap-3 py-4">
              <Search size={18} className="text-ink-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hoodies, jackets, sneakers, watches…"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-muted/60"
              />
              <button type="submit" className="btn-primary btn-sm">Search</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenu(false)}
              className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 z-50 flex h-full w-[82%] max-w-[330px] flex-col bg-paper lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <span className="font-display text-[18px] font-semibold">Atlas &amp; Oak</span>
                <button aria-label="Close menu" onClick={() => setMenu(false)} className="rounded-full p-2 hover:bg-ink/5">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex flex-col p-2">
                {links.map((l) => (
                  <Link key={l.label} href={l.href} className="rounded-xl px-4 py-3.5 text-[15px] hover:bg-ink/5">
                    {l.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-line" />
                {[
                  { label: 'My orders', href: '/orders' },
                  { label: 'Wishlist', href: '/wishlist' },
                  { label: 'Admin dashboard', href: '/admin' },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="rounded-xl px-4 py-3.5 text-[15px] text-ink-soft hover:bg-ink/5">
                    {l.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
