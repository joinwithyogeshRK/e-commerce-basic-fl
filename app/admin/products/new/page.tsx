'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <>
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ChevronLeft size={15} /> Products
      </Link>
      <h1 className="mb-7 mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] font-semibold tracking-tight">
        Add a product
      </h1>
      <ProductForm />
    </>
  );
}
