'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, LogOut, Mail, Package, ShoppingCart, Store } from 'lucide-react';
import { useMisc } from '@/lib/store';
import { adminCredentials } from '@/lib/seed';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/emails', label: 'Email outbox', icon: Mail },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, signIn, signOut } = useMisc();
  const pathname = usePathname();

  if (!admin) return <AdminLogin onSuccess={signIn} />;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="shell flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-display text-[17px] font-semibold">
              Atlas &amp; Oak <span className="text-ink-muted">Admin</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((n) => {
                const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] transition-colors ${
                      active ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-ink/5'
                    }`}
                  >
                    <n.icon size={15} /> {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost btn-sm"><Store size={14} /> Storefront</Link>
            <button onClick={signOut} className="btn-secondary btn-sm"><LogOut size={14} /> Sign out</button>
          </div>
        </div>

        <nav className="shell flex gap-1 overflow-x-auto border-t border-line py-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] text-ink-soft hover:bg-ink/5">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="shell py-8">{children}</main>
    </div>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState(adminCredentials.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim().toLowerCase() === adminCredentials.email && password === adminCredentials.password) {
            onSuccess();
          } else {
            setError('Those credentials do not match. Use the demo login below.');
          }
        }}
        className="card w-full max-w-[400px] p-8"
      >
        <p className="eyebrow">Staff only</p>
        <h1 className="mt-2 font-display text-[26px] font-semibold">Admin sign in</h1>
        <p className="mt-2 text-[13px] text-ink-muted">Manage products, orders and transactional email.</p>

        <div className="mt-7 space-y-4">
          <div>
            <label className="label" htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" className="field" />
          </div>
        </div>

        {error && <p className="mt-3 text-[12.5px] text-sale">{error}</p>}

        <button type="submit" className="btn-primary mt-6 w-full">Sign in</button>

        <div className="mt-5 rounded-xl bg-paper p-4 text-[12.5px] leading-relaxed text-ink-muted">
          <p className="font-medium text-ink">Demo credentials</p>
          <p className="mt-1 font-mono">{adminCredentials.email}</p>
          <p className="font-mono">{adminCredentials.password}</p>
          <button
            type="button"
            onClick={() => setPassword(adminCredentials.password)}
            className="mt-2 underline underline-offset-2 hover:text-ink"
          >
            Fill the password for me
          </button>
        </div>

        <Link href="/" className="mt-5 block text-center text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink">
          Back to the storefront
        </Link>
      </form>
    </div>
  );
}
