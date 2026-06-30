import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { getDefaultMockup } from '@/lib/productMedia';

export function ProductCard({ product }: { product: Product }) {
  const mockup = getDefaultMockup(product);
  return (
    <Link href={`/products/${product.slug}`} className="card block overflow-hidden transition hover:-translate-y-1">
      <div className="bg-slate-100 p-4">
        {mockup ? (
          <Image src={mockup.imageUrl} alt={mockup.altText} width={420} height={300} className="mx-auto h-52 w-full object-contain" />
        ) : (
          <div className="flex h-52 items-center justify-center text-sm text-slate-500">Mockup unavailable</div>
        )}
      </div>
      <div className="p-6">
        <div className="text-xs font-bold uppercase text-ocean">{product.category}</div>
        <h3 className="mt-2 text-xl font-black">{product.name}</h3>
        <p className="mt-2 min-h-12 text-sm text-slate-600">{product.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {product.tags.map((tag) => <span key={tag} className="bg-slate-100 px-3 py-1 text-xs font-semibold">{tag}</span>)}
        </div>
        <div className="mt-5 font-bold">From ${product.basePrice.toFixed(2)}</div>
      </div>
    </Link>
  );
}
