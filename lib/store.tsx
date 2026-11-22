'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { coupons, seedProducts, TAX_RATE } from './seed';
import type { CartLine, MailMessage, Order, OrderStatus, Product } from './types';

/* ------------------------------------------------------------------ */
/*  localStorage-backed state (hydration safe: seed first, load after)  */
/* ------------------------------------------------------------------ */

const PREFIX = 'ao:';

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* corrupted or unavailable storage — fall back to the seed */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* quota exceeded — the demo still works in memory */
    }
  }, [key, value, ready]);

  return [value, setValue, ready] as const;
}

/* ------------------------------------------------------------------ */
/*  Catalog                                                            */
/* ------------------------------------------------------------------ */

type CatalogCtx = {
  products: Product[];
  ready: boolean;
  byId: (id: string) => Product | undefined;
  bySlug: (slug: string) => Product | undefined;
  create: (p: Product) => void;
  update: (id: string, patch: Partial<Product>) => void;
  remove: (id: string) => void;
  resetToSeed: () => void;
};

const CatalogContext = createContext<CatalogCtx | null>(null);

function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts, ready] = usePersisted<Product[]>('catalog', seedProducts);

  const value = useMemo<CatalogCtx>(
    () => ({
      products,
      ready,
      byId: (id) => products.find((p) => p.id === id),
      bySlug: (slug) => products.find((p) => p.slug === slug),
      create: (p) => setProducts((prev) => [p, ...prev]),
      update: (id, patch) =>
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      remove: (id) => setProducts((prev) => prev.filter((p) => p.id !== id)),
      resetToSeed: () => setProducts(seedProducts),
    }),
    [products, ready, setProducts]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within <StoreProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Cart                                                               */
/* ------------------------------------------------------------------ */

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  coupon: string | null;
  couponError: string | null;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  add: (p: Product, opts?: { color?: string; size?: string; qty?: number; silent?: boolean }) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  applyCoupon: (code: string) => boolean;
  clearCoupon: () => void;
  totals: (shippingPrice: number) => Totals;
};

const CartContext = createContext<CartCtx | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = usePersisted<CartLine[]>('cart', []);
  const [coupon, setCoupon] = usePersisted<string | null>('coupon', null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const subtotal = useMemo(
    () => lines.reduce((n, l) => n + l.price * l.qty, 0),
    [lines]
  );

  const add = useCallback<CartCtx['add']>(
    (p, opts = {}) => {
      const color = opts.color ?? p.colors[0]?.name ?? 'Default';
      const size = opts.size ?? p.sizes[Math.min(2, p.sizes.length - 1)] ?? 'One size';
      const qty = opts.qty ?? 1;
      const image = p.colors.find((c) => c.name === color)?.image ?? p.colors[0]?.image ?? '';
      const key = `${p.id}|${color}|${size}`;

      setLines((prev) => {
        const found = prev.find((l) => l.key === key);
        if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
        return [
          ...prev,
          { key, productId: p.id, name: p.name, slug: p.slug, image, price: p.price, color, size, qty },
        ];
      });

      if (!opts.silent) setDrawerOpen(true);
    },
    [setLines]
  );

  const applyCoupon = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      const found = coupons.find((c) => c.code === normalized);
      if (!found) {
        setCouponError('That code is not valid.');
        return false;
      }
      if (subtotal < found.minSpend) {
        setCouponError(`${found.code} needs a subtotal of at least $${found.minSpend}.`);
        return false;
      }
      setCouponError(null);
      setCoupon(normalized);
      return true;
    },
    [subtotal, setCoupon]
  );

  const totals = useCallback<CartCtx['totals']>(
    (shippingPrice) => {
      const found = coupons.find((c) => c.code === coupon);
      let discount = 0;
      let shipping = shippingPrice;

      if (found && subtotal >= found.minSpend) {
        if (found.type === 'percent') discount = (subtotal * found.value) / 100;
        else if (found.type === 'flat') discount = Math.min(found.value, subtotal);
        else if (found.type === 'shipping') shipping = 0;
      }

      const taxable = Math.max(0, subtotal - discount);
      const tax = taxable * TAX_RATE;
      return {
        subtotal: round(subtotal),
        discount: round(discount),
        shipping: round(shipping),
        tax: round(tax),
        total: round(taxable + shipping + tax),
      };
    },
    [coupon, subtotal]
  );

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal,
      coupon,
      couponError,
      drawerOpen,
      setDrawerOpen,
      add,
      remove: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
      setQty: (key, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.key !== key)
            : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 10) } : l))
        ),
      clear: () => setLines([]),
      applyCoupon,
      clearCoupon: () => {
        setCoupon(null);
        setCouponError(null);
      },
      totals,
    }),
    [lines, subtotal, coupon, couponError, drawerOpen, add, applyCoupon, totals, setLines, setCoupon]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <StoreProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Orders                                                             */
/* ------------------------------------------------------------------ */

type OrdersCtx = {
  orders: Order[];
  byId: (id: string) => Order | undefined;
  place: (order: Order) => void;
  advance: (id: string, status: OrderStatus, note?: string) => Order | undefined;
};

const OrdersContext = createContext<OrdersCtx | null>(null);

function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = usePersisted<Order[]>('orders', []);

  const value = useMemo<OrdersCtx>(
    () => ({
      orders,
      byId: (id) => orders.find((o) => o.id === id),
      place: (order) => setOrders((prev) => [order, ...prev]),
      advance: (id, status, note) => {
        let updated: Order | undefined;
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== id) return o;
            updated = {
              ...o,
              status,
              timeline: [
                ...o.timeline,
                { status, at: new Date().toISOString(), note: note ?? statusNote(status) },
              ],
            };
            return updated;
          })
        );
        return updated;
      },
    }),
    [orders, setOrders]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within <StoreProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Outbox (sent email)                                                */
/* ------------------------------------------------------------------ */

type MailCtx = {
  outbox: MailMessage[];
  record: (m: MailMessage) => void;
  clear: () => void;
};

const MailContext = createContext<MailCtx | null>(null);

function MailProvider({ children }: { children: ReactNode }) {
  const [outbox, setOutbox] = usePersisted<MailMessage[]>('outbox', []);
  const value = useMemo<MailCtx>(
    () => ({
      outbox,
      record: (m) => setOutbox((prev) => [m, ...prev].slice(0, 40)),
      clear: () => setOutbox([]),
    }),
    [outbox, setOutbox]
  );
  return <MailContext.Provider value={value}>{children}</MailContext.Provider>;
}

export function useMail() {
  const ctx = useContext(MailContext);
  if (!ctx) throw new Error('useMail must be used within <StoreProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Wishlist + admin session + toasts                                  */
/* ------------------------------------------------------------------ */

type MiscCtx = {
  wishlist: string[];
  toggleWish: (id: string) => void;
  isWished: (id: string) => boolean;
  admin: boolean;
  signIn: () => void;
  signOut: () => void;
  toasts: { id: number; text: string }[];
  toast: (text: string) => void;
};

const MiscContext = createContext<MiscCtx | null>(null);

function MiscProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = usePersisted<string[]>('wishlist', []);
  const [admin, setAdmin] = usePersisted<boolean>('admin', false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.floor(performance.now() % 1000);
    setToasts((prev) => [...prev, { id, text }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const value = useMemo<MiscCtx>(
    () => ({
      wishlist,
      toggleWish: (id) =>
        setWishlist((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id])),
      isWished: (id) => wishlist.includes(id),
      admin,
      signIn: () => setAdmin(true),
      signOut: () => setAdmin(false),
      toasts,
      toast,
    }),
    [wishlist, admin, toasts, toast, setWishlist, setAdmin]
  );

  return <MiscContext.Provider value={value}>{children}</MiscContext.Provider>;
}

export function useMisc() {
  const ctx = useContext(MiscContext);
  if (!ctx) throw new Error('useMisc must be used within <StoreProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */

export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <CatalogProvider>
      <CartProvider>
        <OrdersProvider>
          <MailProvider>
            <MiscProvider>{children}</MiscProvider>
          </MailProvider>
        </OrdersProvider>
      </CartProvider>
    </CatalogProvider>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;

export function statusNote(status: OrderStatus) {
  switch (status) {
    case 'placed':
      return 'Order received and payment authorised.';
    case 'confirmed':
      return 'Payment captured. Your order is being prepared.';
    case 'packed':
      return 'Packed at our Antwerp warehouse.';
    case 'shipped':
      return 'Handed to the carrier and on its way.';
    case 'delivered':
      return 'Delivered. We hope it fits beautifully.';
    case 'cancelled':
      return 'Order cancelled and payment released.';
  }
}
