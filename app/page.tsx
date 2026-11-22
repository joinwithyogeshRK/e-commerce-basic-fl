'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, PackageCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useCatalog } from '@/lib/store';
import { categories } from '@/lib/seed';
import ProductCard from '@/components/shop/ProductCard';
import Rating from '@/components/ui/Rating';

const perks = [
  { icon: Truck, title: 'Free shipping', body: 'On every order, every destination' },
  { icon: RotateCcw, title: '30-day returns', body: 'Free returns and exchanges' },
  { icon: ShieldCheck, title: 'Made properly', body: 'Traceable mills and ateliers' },
  { icon: PackageCheck, title: 'Ships in 48h', body: 'Dispatched same day before 2pm' },
];

const reviews = [
  { name: 'Priya R.', text: 'The Atlas hoodie is the heaviest, best-cut hoodie I own. Three washes in and it still looks new.', product: 'Atlas Heavyweight Hoodie', rating: 5 },
  { name: 'Daniel M.', text: 'Ordered the field jacket on a Tuesday, wore it on Thursday. Sizing advice from the chat was spot on.', product: 'Nocturne Field Jacket', rating: 5 },
  { name: 'Sofia L.', text: 'The Meridian looks far more expensive than it is. Got two — one as a gift.', product: 'Meridian Chronograph', rating: 4 },
];

export default function HomePage() {
  const { products } = useCatalog();
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const newest = [...products]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 8);
  const sale = products.filter((p) => p.compareAt).slice(0, 4);

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="shell grid items-center gap-8 py-14 lg:grid-cols-2 lg:gap-6 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="eyebrow">Autumn / Winter 2026</p>
            <h1 className="mt-4 font-display text-[clamp(2.6rem,6vw,4.4rem)] font-semibold leading-[1.02] tracking-tight">
              Clothes you keep,
              <br />
              not clothes you replace.
            </h1>
            <p className="mt-5 max-w-[460px] text-[15px] leading-relaxed text-ink-muted">
              Heavyweight hoodies, waxed outerwear, silk dresses, leather sneakers and watches
              built to be handed down. Made in limited runs across four ateliers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">
                Shop the collection <ArrowRight size={15} />
              </Link>
              <Link href="/shop?sale=1" className="btn-secondary">
                See what is on sale
              </Link>
            </div>
            <div className="mt-9 flex items-center gap-5">
              <Rating value={4.8} />
              <span className="text-[13px] text-ink-muted">2,418 verified reviews</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -left-10 top-6 h-[62%] w-[62%] rounded-full bg-[#eae3d6] blur-3xl" />
            <div className="relative grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-paper">
                <Image src="/products/model-man.png" alt="Model in the Nocturne field jacket" fill priority sizes="(max-width:1024px) 45vw, 25vw" className="object-contain object-bottom p-3" />
              </div>
              <div className="mt-8 grid gap-3">
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-paper">
                  <Image src="/products/sneaker-chalk.png" alt="Court low sneaker" fill sizes="25vw" className="object-contain p-5" />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-paper">
                  <Image src="/products/watch-steel.png" alt="Meridian chronograph" fill sizes="25vw" className="object-contain p-7" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* perks */}
      <section className="border-b border-line bg-paper">
        <div className="shell grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <p.icon size={19} className="mt-0.5 shrink-0 text-forest" />
              <div>
                <p className="text-[13px] font-medium">{p.title}</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* categories */}
      <section className="shell py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Shop by category</p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.7rem)] font-semibold tracking-tight">
              Three doors in
            </h2>
          </div>
          <Link href="/shop" className="link-underline hidden text-[13px] text-ink-soft sm:block">
            Browse everything
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {categories.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/shop?category=${c.key}`}
                className="group relative flex h-[300px] flex-col justify-end overflow-hidden rounded-3xl border border-line bg-surface p-6"
              >
                <div className="absolute inset-x-0 top-2 h-[70%]">
                  <Image src={c.image} alt={c.label} fill sizes="(max-width:768px) 100vw, 33vw" className="object-contain p-6 transition-transform duration-700 ease-silk group-hover:scale-[1.07]" />
                </div>
                <div className="relative">
                  <h3 className="font-display text-[22px] font-semibold">{c.label}</h3>
                  <p className="mt-1 text-[13px] text-ink-muted">{c.blurb}</p>
                  <span className="mt-3 inline-flex items-center gap-2 text-[12px] font-medium">
                    Shop {c.label.toLowerCase()}
                    <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* featured */}
      <section className="shell pb-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">The edit</p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.7rem)] font-semibold tracking-tight">
              Pieces we stand behind
            </h2>
          </div>
          <Link href="/shop" className="link-underline hidden text-[13px] text-ink-soft sm:block">
            View all {products.length}
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* editorial */}
      <section className="border-y border-line bg-surface">
        <div className="shell grid items-center gap-10 py-16 lg:grid-cols-2">
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-paper">
            <Image src="/products/rack.png" alt="A rail of Atlas & Oak outerwear" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-contain p-6" />
          </div>
          <div>
            <p className="eyebrow">The house</p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.7rem)] font-semibold leading-tight tracking-tight">
              Fewer things,
              <br />
              made properly.
            </h2>
            <p className="mt-5 max-w-[460px] text-[15px] leading-relaxed text-ink-muted">
              We produce in runs of a few hundred, from mills we have used for a decade. Every
              garment carries a traceable identity — scan the inner label and you see the farm,
              the mill, the cutter and the finisher.
            </p>
            <div className="mt-8 grid max-w-[420px] grid-cols-3 gap-6 border-t border-line pt-6">
              {[['1998', 'Founded'], ['04', 'Ateliers'], ['92%', 'Traceable']].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-[26px] font-semibold">{v}</p>
                  <p className="mt-1 text-[12px] text-ink-muted">{l}</p>
                </div>
              ))}
            </div>
            <Link href="/about" className="btn-secondary mt-8">Read our story</Link>
          </div>
        </div>
      </section>

      {/* new in */}
      <section className="shell py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Just landed</p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.7rem)] font-semibold tracking-tight">New arrivals</h2>
          </div>
          <Link href="/shop?sort=newest" className="link-underline hidden text-[13px] text-ink-soft sm:block">
            See all new in
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {newest.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* assistant callout */}
      <section className="shell pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-ink px-6 py-12 text-paper sm:px-12">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-forest/40 blur-3xl" />
          <div className="relative max-w-[560px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1.5 text-[11px] uppercase tracking-wide2">
              <Bot size={13} /> Meet Ora
            </span>
            <h2 className="mt-5 font-display text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold leading-tight">
              An assistant that actually shops with you.
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-paper/70">
              Ask for &ldquo;hoodies under $150&rdquo; and Ora pulls them up. Ask it to add one to your
              bag and it does. It knows sizing, delivery times, our return policy and the status of
              every order you have placed.
            </p>
            <p className="mt-6 text-[13px] text-paper/50">
              Tap the button in the bottom-right corner to start a conversation.
            </p>
          </div>
        </div>
      </section>

      {/* sale */}
      {sale.length > 0 && (
        <section className="shell pb-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Last chance</p>
              <h2 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.7rem)] font-semibold tracking-tight">On sale now</h2>
            </div>
            <Link href="/shop?sale=1" className="link-underline hidden text-[13px] text-ink-soft sm:block">
              All reductions
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4">
            {sale.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* reviews */}
      <section className="border-t border-line bg-surface">
        <div className="shell py-16">
          <p className="eyebrow">What people say</p>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.7rem)] font-semibold tracking-tight">
            4.8 average, 2,418 reviews
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.name} className="card p-6">
                <Rating value={r.rating} />
                <blockquote className="mt-4 text-[14px] leading-relaxed text-ink-soft">
                  &ldquo;{r.text}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-[12px] text-ink-muted">
                  <span className="font-medium text-ink">{r.name}</span> · {r.product}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
