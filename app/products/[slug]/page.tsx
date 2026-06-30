import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/products';
import { getDefaultMockup } from '@/lib/productMedia';
import { PriceBreaks } from '@/components/PriceBreaks';
import { ProductConfigurator } from '@/components/ProductConfigurator';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return notFound();
  const mockup = getDefaultMockup(product);
  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-2">
      <div className="card overflow-hidden">
        <div className="bg-slate-100 p-8">
          {mockup ? (
            <Image src={mockup.imageUrl} alt={mockup.altText} width={800} height={800} className="h-[520px] w-full object-contain" priority />
          ) : (
            <div className="flex h-[520px] items-center justify-center text-slate-500">No active product mockup</div>
          )}
        </div>
      </div>
      <div>
        <div className="text-sm font-bold uppercase text-ocean">{product.category}</div>
        <h1 className="mt-2 text-5xl font-black">{product.name}</h1>
        <p className="mt-4 text-lg text-slate-600">{product.description}</p>
        <div className="mt-8"><h2 className="mb-3 font-black">Price breaks</h2><PriceBreaks breaks={product.priceBreaks} /></div>
        <ProductConfigurator product={product} />
        <div className="mt-6 flex gap-3">
          <Link className="btn-primary" href={`/design/${product.slug}`}>Open design studio</Link>
          <Link className="btn-secondary" href="/checkout">Request quote</Link>
        </div>
      </div>
    </main>
  );
}
