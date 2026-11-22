import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Our story' };

export default function AboutPage() {
  return (
    <div className="shell max-w-[900px] py-12">
      <p className="eyebrow">The house</p>
      <h1 className="mt-2 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-tight tracking-tight">
        Fewer things, made properly.
      </h1>

      <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl bg-surface">
        <Image src="/products/rack.png" alt="A rail of Atlas & Oak outerwear" fill sizes="900px" className="object-contain p-8" />
      </div>

      <div className="mt-10 space-y-5 text-[15.5px] leading-relaxed text-ink-muted">
        <p>
          Atlas &amp; Oak began in 1998 in a single Antwerp workroom with one rule: make fewer
          things, and make them properly. Three decades on, that rule still decides everything — the
          mills we buy from, the patterns we keep, and the pieces we refuse to produce.
        </p>
        <p>
          We produce in runs of a few hundred rather than tens of thousands. It costs more and it
          sells out faster, but it means every metre of cloth is accounted for and nothing ends up
          discounted into a landfill at the end of a season.
        </p>
        <p>
          Each garment carries a traceable identity. Scan the inner label and you will see the farm,
          the mill, the cutter and the finisher who put their hands on it. Today 92% of what we make
          is fully traceable; our target is all of it by 2028.
        </p>
      </div>

      <section id="sustainability" className="mt-12 scroll-mt-28 rounded-3xl bg-surface p-8">
        <h2 className="font-display text-[24px] font-semibold">Sustainability</h2>
        <ul className="mt-4 space-y-3 text-[14.5px] leading-relaxed text-ink-muted">
          <li>— Organic and long-staple cottons only, from four named mills.</li>
          <li>— Repairs are free for the first two years on everything we make.</li>
          <li>— Packaging is paper, printed with soy ink, and plastic-free since 2021.</li>
          <li>— Offcuts go back to the mill; we have sent nothing to landfill since 2019.</li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary">Shop the collection</Link>
        <Link href="/help" className="btn-secondary">Help &amp; policies</Link>
      </div>
    </div>
  );
}
