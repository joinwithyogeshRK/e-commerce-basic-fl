'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import { useCatalog } from '@/lib/store';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { byId, ready } = useCatalog();
  const product = byId(id);

  if (!product) {
    return (
      <div className="card flex flex-col items-center gap-3 p-16 text-center">
        <p className="font-display text-[22px]">{ready ? 'Product not found' : 'Loading…'}</p>
        {ready && <Link href="/admin/products" className="btn-primary mt-2">Back to products</Link>}
      </div>
    );
  }

  return (
    <>
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink">
        <ChevronLeft size={15} /> Products
      </Link>
      <h1 className="mb-1 mt-3 font-display text-[clamp(1.8rem,3.6vw,2.4rem)] font-semibold tracking-tight">
        {product.name}
      </h1>
      <p className="mb-7 text-[13px] text-ink-muted">Editing {product.id}</p>
      <ProductForm existing={product} />
    </>
  );
}
